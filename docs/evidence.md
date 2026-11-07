# Research and standards behind SynOdor

SynOdor v0.1 implements software routing. No human-subject data, molecular embeddings, device measurements, stimulation parameters or perfume recipes ship in the package. Every binding in the sample catalog was created for the demo.

| Primary source | Observation | Design consequence |
| --- | --- | --- |
| Holbrook et al., *International Forum of Allergy & Rhinology*, 2019 (online 2018), 9(2), 158–164. [Induction of smell through transethmoid electrical stimulation of the olfactory bulb](https://pubmed.ncbi.nlm.nih.gov/30480384/) | Three of five participants reported smell perception. Cortical recordings did not provide objective confirmation. Participants had a history of sinus surgery. | A reported sensation cannot establish how to reproduce a named perfume across users. |
| Karunanayaka, Cheok and Vedadi, *IEEE Access*, 2023. [Digital Smell: Toward Electrically Reproducing Artificial Smell Sensations](https://doi.org/10.1109/ACCESS.2023.3278093) | In a study of 31 healthy participants, different people described sweet and chemical sensations under the same stimulation condition. | Neural waveform lookup falls outside the package. This is an experimental paper. |
| Lee et al., *Science*, 2023. [A principal odor map unifies diverse tasks in olfactory perception](https://pmc.ncbi.nlm.nih.gov/articles/PMC11898014/) | The authors predicted perceptual descriptors from molecular structure and describe limitations for mixtures and concentration. | A perfume SKU and a sensor fingerprint cannot be converted into a POM embedding by simple lookup without an externally established link. |
| Scentronic study, *Science Advances*, 2026. [Original paper](https://doi.org/10.1126/sciadv.aee9266) · [Research team overview](https://engineering.osu.edu/news/2026/11/new-tech-passes-smell-test) | A lab prototype pairs e-nose classification with wearable odor release. | A classification event and a cartridge inventory are practical software boundaries. These devices have not been integrated with SynOdor. |

## Standards and interfaces

- ISO/IEC 23005-3 defines descriptions of sensory effects. SynOdor exports one lilac effect in the namespace used by the [public reference SEV schema](https://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-V_schema_files/MPEG-V-SEV.xsd). See the [2019 edition summary](https://webstore.iec.ch/en/publication/65615) for the wider specification.
- Part 5 defines device command and sensed information vocabularies. Our playback plan is vendor-neutral JSON defined by this project. Its fields have no Part 5 conformance claim. [ISO/IEC 23005-5](https://www.iso.org/standard/73438.html)
- ISO specifies common types and conformance resources separately. The v0.1 test checks one XML instance against the reference XSDs. Hardware timing, perceptual equivalence and full protocol conformance require separate tests. [Part 6](https://www.iso.org/standard/73439.html) · [Part 7](https://www.iso.org/standard/75529.html)
- IEEE P2520.1 is a project concerning baseline performance and test methods for machine olfaction devices. It supplies no playback table in this project. [IEEE Standards Association](https://standards.ieee.org/ieee/2520.1/12676/)
- Bosch's BME688 workflow illustrates how sensor measurements can be collected, labeled and used to train an application-specific classifier. A developer can adapt the classifier's output to a SynOdor event. SynOdor ships no Bosch driver or trained model. [Bosch AI-Studio documentation](https://www.bosch-sensortec.com/software/bme/docs/overview/getting-started.html)

## Adding real evidence

For a measured mapping, record the device and model revision, sample identity, calibration and evaluation conditions, source, and redistribution terms alongside your catalog. A label licensed for one model or an aroma associated with a trade name is insufficient evidence for a new product or model. Keep low-confidence results as explicit abstentions.
