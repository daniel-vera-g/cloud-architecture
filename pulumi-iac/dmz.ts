import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import * as azure_nextgen from "@pulumi/azure-nextgen";

function createFirewall(
  resourceGroupName: string,
  location: string,
  dmzSubnet: azure.network.Subnet
): azure_nextgen.network.latest.AzureFirewall {
  const firewall = new azure_nextgen.network.latest.AzureFirewall("firewall", {
    resourceGroupName: resourceGroupName,
    location: location,
    azureFirewallName: "dmzFirewall",
    ipConfigurations: [
      {
        name: "configuration",
        subnet: {
          id: dmzSubnet.id,
        },
      },
    ],
  });

  return firewall;
}

export function setupMonitoringAndSecurity(
  resourceGroupName: string,
  location: string
) {
  const logAnalyticsWorkspace =
    new azure.operationalinsights.AnalyticsWorkspace("logAnalyticsWorkspace", {
      resourceGroupName: resourceGroupName,
      location: location,
      sku: "PerGB2018",
    });

  const diagnosticSetting = new azure.monitoring.DiagnosticSetting(
    "diagnosticSetting",
    {
      // ... configure diagnostic settings here
    }
  );

  // Setup Alert Rules
  const alertRule = new azure.monitoring.MetricAlertRule("alertRule", {
    // ... configure alert rule settings here
  });

  // Define Action Groups for alerts
  const actionGroup = new azure.monitoring.ActionGroup("actionGroup", {
    // ... configure action group settings here
  });

  // Azure Security Center (optional, depending on your subscription and needs)
  // ... setup Security Center features

  return { logAnalyticsWorkspace, diagnosticSetting, alertRule, actionGroup };
}
export function setupDmz(
  resourceGroupName: string,
  location: string,
  dmzSubnet: azure.network.Subnet
) {
  const firewall = createFirewall(resourceGroupName, location, dmzSubnet);
  setupMonitoringAndSecurity(resourceGroupName, location);

  return { firewall };
}
