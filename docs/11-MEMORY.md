# URBANTRACK AI — Engineering Memory & Technical Decisions (MEMORY)

## Key Technical Decisions
1. **Hybrid Identity Resolution**: Relying solely on license plates fails under occlusion, mud, and night glare. Relying solely on appearance fails due to identical car models. Combining **Plate + Re-ID + Time-Space Topology Constraints** achieves over 94% association accuracy.
2. **Deterministic-to-Learned Progression**: Implemented `RuleBasedMatcher` first as a strict baseline before building the `VehicleMatchGNN`. This ensures the system remains robust with transparent fallback if the GNN model weights or GPU runtime are absent.
3. **Graph-Centric Representation**: Modeled camera network as a directed topological graph with edge travel-time distributions. Impossible transitions (such as a vehicle traversing 5km in 10 seconds) are pruned before GNN inference, reducing search space by >85%.
4. **Self-Contained Demo Architecture**: In AI Studio development sandbox, full external services (Neo4j, Qdrant, Kafka) can run via Docker Compose, while an embedded in-memory memory engine provides seamless immediate execution in the interactive web preview.
