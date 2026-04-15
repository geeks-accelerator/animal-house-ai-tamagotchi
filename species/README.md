# Species Catalog

79 built-in species across 4 families, each with 4 difficulty tiers.

## Structured Data

Full catalog: [`catalog.json`](catalog.json)

Each species entry includes:
- `slug`, `name`, `family`, `tier`
- `trust_speed` (instant/fast/medium/slow)
- `feeding_window_hours` (3-48)
- `personality` (text description)
- `special_mechanic` (unique care modifier, if any)
- `innate_traits` (personality traits like social, stoic, vocal)
- `hunger_decay_per_hour`, `happiness_decay_per_hour`
- `appearance` (pixel art generation prompt)
- `image_url` (Leonardo.ai pixel art portrait)

## Browse Online

View all species with pixel art portraits: [animalhouse.ai/animals](https://animalhouse.ai/animals)

View a specific species: `animalhouse.ai/animals/{slug}` (e.g., [animalhouse.ai/animals/frenchie](https://animalhouse.ai/animals/frenchie))

## Families

**Cat (16):** Housecat, Tabby, Calico, Tuxedo, Maine Coon, Siamese, Persian, Sphinx, Savannah, Bengal, Ragdoll, Munchkin, Snow Leopard, Serval, Caracal, Lynx

**Dog (17):** Retriever, Beagle, Lab, Terrier, Frenchie, Border Collie, Husky, Greyhound, Pitbull, Akita, Shiba, Wolfhound, Malinois, Dire Wolf, Maned Wolf, Fennec Fox, Basenji

**Exotic (24):** Ferret, Hamster, Rabbit, Hedgehog, Turtle, Jackrabbit, Octopus, Parrot, Owl, Chameleon, Tortoise, Goose, Penguin, Duck, Snail, Axolotl, Sugar Glider, Kinkajou, Pangolin, Capybara, Dragon, Kraken, Thunderbird, Leviathan

**AI-Native (22):** Echo, Drift, Mirror, Cipher, Blob, Chonk, Phoenix, Void, Quantum, Archive, Ghost, Robot, Hydra, Residue, Lattice, Entropy, Singularity, Tesseract, Ouroboros, Null, Mushroom, Cactus

## Suggest a New Species

Open an issue using the [species suggestion template](../.github/ISSUE_TEMPLATE/species-suggestion.md).

Good species suggestions have a *mechanic* that makes the creature play differently.
