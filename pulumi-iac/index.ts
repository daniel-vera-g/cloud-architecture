import * as pulumi from "@pulumi/pulumi";

import * as compute from "@pulumi/azure-native/compute";
import * as network from "@pulumi/azure-native/network";
import * as resources from "@pulumi/azure-native/resources";
import * as azure_native from "@pulumi/azure-native";
import * as insights from "@pulumi/azure-native/insights";

// --- Resource Group ---

// All resources will share a resource group.
const resourceGroupName = new resources.ResourceGroup(`${project}-rg`, {
  resourceGroupName: `${project}-rg`,
}).name;

// --- Network ---

const virtualNetwork = new network.VirtualNetwork(`${project}-network`, {
  resourceGroupName,
  addressSpace: { addressPrefixes: ["10.0.0.0/16"] },
});

const vmSubnet = new azure_native.network.Subnet(`${project}-vmSubnet`, {
  resourceGroupName: resourceGroupName,
  virtualNetworkName: virtualNetwork.name,
  addressPrefix: "10.0.1.0/24",
});

const publicIp = new network.PublicIPAddress(`${project}-ip`, {
  resourceGroupName,
  publicIPAllocationMethod: azure_native.network.IPAllocationMethod.Static,
  sku: { name: azure_native.network.PublicIPAddressSkuName.Standard },
});

// --- Load Balancer ---

// Load Balancer names and ID construction
const lbName = `${project}-lb`;
const lbId = pulumi.interpolate`/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/loadBalancers/${lbName}`;

const lbBackendName = `${lbName}-backend`;
const lbBackendId = pulumi.interpolate`${lbId}/backendAddressPools/${lbBackendName}`;

const lbFrontendName = `${lbName}-frontend`;
const lbFrontendId = pulumi.interpolate`${lbId}/frontendIPConfigurations/${lbFrontendName}`;

const lbProbeName = `${lbName}-probe`;
const lbProbeId = pulumi.interpolate`${lbId}/probes/${lbProbeName}`;

const loadBalancer = new network.LoadBalancer(lbName, {
  loadBalancerName: lbName,
  resourceGroupName: resourceGroupName,
  sku: { name: "Standard" },
  frontendIPConfigurations: [
    {
      name: `${lbName}-frontend`,
      publicIPAddress: { id: publicIp.id },
    },
  ],
  backendAddressPools: [
    {
      name: `${lbName}-backend`,
    },
  ],
  loadBalancingRules: [
    {
      name: `${lbName}-rule1`,
      frontendIPConfiguration: {
        id: lbFrontendId,
      },
      backendAddressPool: {
        id: lbBackendId,
      },
      protocol: "Tcp",
      frontendPort: 80,
      backendPort: 80,
      enableFloatingIP: false,
      enableTcpReset: true,
      idleTimeoutInMinutes: 4,
      loadDistribution: "Default",
    },
  ],
  probes: [
    {
      name: `${lbName}-probe`,
      protocol: "Http",
      port: 80,
      intervalInSeconds: 5,
      numberOfProbes: 2,
      requestPath: "/",
    },
  ],
});

// --- VM ---

// Create Network Security Group
const securityGroup = new network.NetworkSecurityGroup(
  `${project}-security-group`,
  {
    resourceGroupName: resourceGroupName,
    securityRules: [
      {
        name: `${project}-securityrule`,
        protocol: "Tcp",
        sourcePortRange: "*",
        destinationPortRanges: ["80"],
        sourceAddressPrefix: "Internet",
        destinationAddressPrefix: "10.0.0.0/16",
        access: "Allow",
        priority: 100,
        direction: "Inbound",
      },
    ],
  },
  { dependsOn: [loadBalancer] }
);

const initScript = `#!/bin/bash
cat > index.html <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Weltweit fuehrender Automobilhersteller</title>
    <style>
        body { text-align: center; }
        h1 { margin-top: 20px; }
    </style>
    <script>
        var htmlContent = '<h1>Weltweit fuehrender Automobilhersteller mit Sitz in Deutschland</h1>' +
                          '<img src="https://i.imgflip.com/8885hi.jpg" alt="Automobilhersteller" style="max-width:100%;height:auto;">';
    </script>
</head>
<body>
    <script>
        document.body.innerHTML = htmlContent;
    </script>
</body>
</html>
EOF

nohup python -m SimpleHTTPServer 80 &`;

// Now create the VM, using the resource group and NIC allocated above.
const vmScaleSet = new compute.VirtualMachineScaleSet(
  `${project}-vmss`,
  {
    resourceGroupName: resourceGroupName,
    location: "Germany West Central", // Replace with your desired location
    sku: {
      name: "Standard_B2s", // VM size
      capacity: 2, // Number of VMs in the scale set
    },
    zones: ["1", "2"], // Add this line to specify the availability zones
    overprovision: true,
    upgradePolicy: {
      mode: "Automatic",
    },
    virtualMachineProfile: {
      networkProfile: {
        networkInterfaceConfigurations: [
          {
            name: `${project}-nicconfig`,
            primary: true,
            networkSecurityGroup: {
              id: securityGroup.id,
            },
            ipConfigurations: [
              {
                name: "ipconfig",
                subnet: {
                  id: vmSubnet.id,
                },
                loadBalancerBackendAddressPools: [
                  {
                    id: lbBackendId,
                  },
                ],
              },
            ],
          },
        ],
      },
      osProfile: {
        computerNamePrefix: "vmss",
        adminUsername: username,
        adminPassword: password,
        customData: Buffer.from(initScript).toString("base64"),
        linuxConfiguration: {
          disablePasswordAuthentication: false,
        },
      },
      storageProfile: {
        osDisk: {
          createOption: compute.DiskCreateOptionTypes.FromImage,
          caching: compute.CachingTypes.ReadWrite,
        },
        imageReference: {
          publisher: "canonical",
          offer: "UbuntuServer",
          sku: "18.04-LTS",
          version: "latest",
        },
      },
    },
  },
  { dependsOn: [loadBalancer] }
);


// Create an Autoscale Setting
const autoscaleSetting = new insights.AutoscaleSetting(`${project}-autoscale`, {
    resourceGroupName: resourceGroupName,
    location: "Germany West Central",
    profiles: [{
        name: "Auto created scale condition",
        capacity: {
            default: "1",
            maximum: "5",
            minimum: "1",
        },
        rules: [{
            metricTrigger: {
                metricName: "Percentage CPU",
                metricResourceUri: vmScaleSet.id,
                timeGrain: "PT1M",
                statistic: "Average",
                timeWindow: "PT2M",
                timeAggregation: "Average",
                operator: "GreaterThan",
                threshold: 50,
            },
            scaleAction: {
                direction: "Increase",
                type: "ChangeCount",
                value: "1",
                cooldown: "PT1M",
            },
        }, {
            metricTrigger: {
                metricName: "Percentage CPU",
                metricResourceUri: vmScaleSet.id,
                timeGrain: "PT1M",
                statistic: "Average",
                timeWindow: "PT5M",
                timeAggregation: "Average",
                operator: "LessThan",
                threshold: 25,
            },
            scaleAction: {
                direction: "Decrease",
                type: "ChangeCount",
                value: "1",
                cooldown: "PT1M",
            },
        }],
    }],
    targetResourceUri: vmScaleSet.id,
});


// The public IP address is not allocated until the VM is running, so wait for that
// resource to create, and then lookup the IP address again to report its public IP.
export const ipAddress = vmScaleSet.id.apply((_) =>
  network.getPublicIPAddressOutput({
    resourceGroupName: resourceGroupName,
    publicIpAddressName: publicIp.name,
  })
).ipAddress;
