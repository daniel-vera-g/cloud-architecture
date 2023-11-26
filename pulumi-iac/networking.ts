import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";

export function createVirtualNetwork(
  resourceGroupName: string,
  location: string,
  vnetName: string
): azure.network.VirtualNetwork {
  return new azure.network.VirtualNetwork(vnetName, {
    resourceGroupName: resourceGroupName,
    location: location,
    addressSpaces: ["10.0.0.0/16"],
  });
}

function createSubnet(
  vnet: azure.network.VirtualNetwork,
  subnetName: string,
  addressPrefix: string
): azure.network.Subnet {
  return new azure.network.Subnet(subnetName, {
    resourceGroupName: vnet.resourceGroupName,
    virtualNetworkName: vnet.name,
    addressPrefix: addressPrefix,
  });
}

export function setupNetwork(
  resourceGroupName: string,
  location: string,
  vnetName: string
) {
  const vnet = createVirtualNetwork(resourceGroupName, location, vnetName);

  const dmzSubnet = createSubnet(vnet, "dmzSubnet", "10.0.1.0/24");
  const frontendSubnet = createSubnet(vnet, "frontendSubnet", "10.0.2.0/24");
  const bastionSubnet = createSubnet(vnet, "bastionSubnet", "10.0.3.0/24");

  return { vnet, dmzSubnet, frontendSubnet, bastionSubnet };
}
