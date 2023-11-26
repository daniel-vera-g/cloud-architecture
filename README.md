# cloud-architecture

> Sample 3-Tier azure cloud architecture

<!-- - [Exemplary provisioning of the Frontend tier with Pulumi IaC](./pulumi-iac/README.md) -->

![Architecture](diagrams/3-tier-azure-cloud-architecture.drawio.png)

- The Virtual machine scale sets enable (multi region) auto scaling for better availability
- The DMZ contains an Azure firewall and the Azure Monitor / Security Center. All inbound / outbound traffic has to pass this zone to increase security.

## Requirements

| Requirements                    | Azure Implementation                             |
| ------------------------------- | ------------------------------------------------ |
| 1. Availability and Scalability | Virtual Machine Scale Sets (VMSS)                |
|                                 | Load Balancer                                    |
|                                 | Auto Scaling                                     |
|                                 | Azure multi region infrastructure                |
| 2. Security                     | Azure firewall                                   |
|                                 | Network security groups (NSGs)                   |
|                                 | Subnets                                          |
|                                 | Key Vault                                        |
|                                 | Bastion                                          |
| 3. Backup and recovery          | Azure site recovery                              |
|                                 | Failover mechanisms for critical components      |
|                                 | Azure Backups                                    |
| 4. Monitoring                   | Azure monitor and application insights           |
|                                 | Log analytics                                    |
|                                 | Automatic notification through the azure monitor |

## References

- https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier
