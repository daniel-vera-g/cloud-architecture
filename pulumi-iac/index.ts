import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import { setupNetwork } from "./networking";
import { setupDmz } from "./dmz";
import { setupFrontend } from "./frontend";
import { setupBastion } from "./bastion";
import { setupLoadBalancer } from "./load_balancer";

// Set up the Azure resource group
const resourceGroup = new azure.core.ResourceGroup("3TierResourceGroup", {
  location: "West Europe",
});

// Set up the network
const { vnet, dmzSubnet, frontendSubnet, bastionSubnet } = setupNetwork(
  resourceGroup.name,
  resourceGroup.location,
  "3TierVnet"
);

// // Set up the DMZ
// const dmzResources = setupDmz(
//   resourceGroup.name,
//   resourceGroup.location,
//   dmzSubnet
// );

// // Set up the Frontend
// const frontendResources = setupFrontend(
//   resourceGroup.name,
//   resourceGroup.location,
//   frontendSubnet
// );

// // Set up the Bastion
// const bastionResources = setupBastion(
//   resourceGroup.name,
//   resourceGroup.location,
//   bastionSubnet
// );

// // Set up the Load Balancer
// const loadBalancerResources = setupLoadBalancer(
//   resourceGroup.name,
//   resourceGroup.location,
//   frontendSubnet
// );
