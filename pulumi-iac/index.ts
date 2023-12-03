import * as pulumi from "@pulumi/pulumi";

import * as compute from "@pulumi/azure-native/compute";
import * as network from "@pulumi/azure-native/network";
import * as resources from "@pulumi/azure-native/resources";
import * as azure_native from "@pulumi/azure-native";

const username = "";
const password = "";
const project = "";
const subscriptionId = "";

// --- Resource Group ---

// All resources will share a resource group.
const resourceGroupName = new resources.ResourceGroup("group4TheWin_rg", {
  resourceGroupName: "group4TheWin_rg",
}).name;

// --- Network ---

const virtualNetwork = new network.VirtualNetwork("server-network", {
  resourceGroupName,
  addressSpace: { addressPrefixes: ["10.0.0.0/16"] },
});

const subnet = new azure_native.network.Subnet("subnet", {
  resourceGroupName: resourceGroupName,
  virtualNetworkName: virtualNetwork.name,
  addressPrefix: "10.0.1.0/24",
});

const publicIp = new network.PublicIPAddress("server-ip", {
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

// --- VM ---

const networkInterface = new network.NetworkInterface(
  `${project}-network-interface`,
  {
    resourceGroupName: resourceGroupName,
    networkSecurityGroup: {
      id: securityGroup.id,
    },
    ipConfigurations: [
      {
        name: "webserver-ipconfiguration",
        privateIPAllocationMethod: "Dynamic",
        subnet: {
          id: subnet.id,
        },
        loadBalancerBackendAddressPools: [
          {
            id: pulumi.interpolate`${loadBalancer.id}/backendAddressPools/${lbName}-backend`,
          },
        ],
      },
    ],
  },
  { dependsOn: [loadBalancer] }
);

const initScript = `#!/bin/bash\n
echo "Hello, World!" > index.html
nohup python -m SimpleHTTPServer 80 &`;

// Now create the VM, using the resource group and NIC allocated above.
const vm = new compute.VirtualMachine(
  "server-vm",
  {
    resourceGroupName,
    networkProfile: {
      networkInterfaces: [{ id: networkInterface.id }],
    },
    hardwareProfile: {
      vmSize: compute.VirtualMachineSizeTypes.Standard_B2s,
    },
    osProfile: {
      computerName: "hostname",
      adminUsername: username,
      adminPassword: password,
      customData: Buffer.from(initScript).toString("base64"),
      linuxConfiguration: {
        disablePasswordAuthentication: false,
      },
    },
    storageProfile: {
      osDisk: {
        createOption: compute.DiskCreateOption.FromImage,
        name: "myosdisk1",
      },
      imageReference: {
        publisher: "canonical",
        offer: "UbuntuServer",
        sku: "18.04-LTS",
        version: "latest",
      },
    },
  },
  { dependsOn: [loadBalancer] }
);

// The public IP address is not allocated until the VM is running, so wait for that
// resource to create, and then lookup the IP address again to report its public IP.
export const ipAddress = vm.id.apply((_) =>
  network.getPublicIPAddressOutput({
    resourceGroupName: resourceGroupName,
    publicIpAddressName: publicIp.name,
  })
).ipAddress;
