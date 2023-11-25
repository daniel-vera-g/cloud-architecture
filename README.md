# cloud-architecture

> Sample 3-Tier azure cloud architecture implemented with Pulumi

The goal is an architecture with following requirements:

<!-- TODO: How achieved -->

1. Modularity
2. Scalability
3. High Availability
4. Fault tolerance
5. Security

## Architecture

![Architecture](diagrams/3-tier-azure-cloud-architecture.drawio.png)

Components:

1. **Availability Sets** : Increases the availability to reach the given SLAs
2. **Subnets**: Separate the networks
3. **Load Balancers** :
   - External load balancer with public IP to distribute incoming traffic to the Frontend tier.
   - Internal load balancer to distribute frontend traffic to the middleware tier
4. **NSGs / Network security groups** : Restrict network traffic within the virtual network.
   - Only the middleware should be able to access the Backend / DB tier
5. **Key Vault** : Store encryption keys to encrypt the replication data at rest

## Practical implementation

> An exemplary frontend tier is implemented to showcase a part of the architecture.

For this demo, we add two parts which are non azure related:

1. **Sample web application** : React application, which represents a strooongly simplified car part ERP. For the sake of this exercise, we simulate the middleware and backend tier by storing and processing everything in memory.
2. **Pulumi** : IaC-Tool to provision the azure components

## References

- https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier
- Fork used for the Web Application: https://github.com/daniel-vera-g/crud-app
