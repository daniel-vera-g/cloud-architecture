# cloud-architecture

> Sample 3-Tier azure cloud architecture implemented with Pulumi

## Architecture

![Architecture](diagrams/3-tier-azure-cloud-architecture.drawio.png)

Components:

1. **Availability Sets** : Increases the availability to reach the given SLAs
2. **Subnets**: Separate the networks
3. **Load Balancers** :
   - External load balancer with public IP to distribute incoming traffic to the Frontend tier.
   - Internal load balancer to distribute frontend traffic to the middleware tier
4. NSGs / Network security groups: Restrict network traffic within the virtual network.
   - Only the middleware should be able to access the Backend / DB tier
5. **Key Vault** : Store encryption keys to encrypt the replication data at rest
