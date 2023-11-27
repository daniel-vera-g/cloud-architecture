import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";

// Function to create Bastion Host
function createBastionHost(
  resourceGroupName: string,
  location: string,
  bastionSubnet: azure.network.Subnet
): azure.compute.VirtualMachine {
  // Create and configure Bastion host VM
  // ...
}

// Function to setup Network Security Group for the Bastion Subnet
function setupBastionNSG(
  resourceGroupName: string,
  bastionSubnet: azure.network.Subnet
): azure.network.NetworkSecurityGroup {
  // Create and configure NSG rules for SSH access
  // ...
}

// Exported function to setup the entire Bastion infrastructure
export function setupBastion(
  resourceGroupName: string,
  location: string,
  bastionSubnet: azure.network.Subnet
) {
  const bastionHost = createBastionHost(
    resourceGroupName,
    location,
    bastionSubnet
  );
  const nsg = setupBastionNSG(resourceGroupName, bastionSubnet);

  return { bastionHost, nsg };
}
