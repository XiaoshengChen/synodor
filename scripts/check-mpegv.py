"""Check an exported SEM document using the ISO public reference XSDs.

Optional maintainer check. Run with Python 3, lxml and internet access.
The runtime toolkit itself only needs Node.js.
"""
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
from urllib.request import urlopen

from lxml import etree

BASE = "https://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-V_schema_files/"
SEV = BASE + "MPEG-V-SEV.xsd"
HOSTS = {"standards.iso.org", "www.w3.org"}


class OfficialSchemas(etree.Resolver):
    def resolve(self, url, public_id, context):
        parts = urlsplit(url)
        if parts.hostname not in HOSTS or parts.scheme not in {"http", "https"}:
            raise ValueError(f"Unexpected XSD location: {url}")
        secure = urlunsplit(("https", parts.netloc, parts.path, parts.query, ""))
        with urlopen(secure, timeout=30) as response:
            return self.resolve_string(response.read(), context, base_url=secure)


def main(path):
    parser = etree.XMLParser(resolve_entities=False, load_dtd=False, no_network=True)
    parser.resolvers.add(OfficialSchemas())
    schema = etree.XMLSchema(etree.parse(SEV, parser))
    document = etree.fromstring(Path(path).read_bytes(), etree.XMLParser(
        resolve_entities=False, load_dtd=False, no_network=True
    ))
    schema.assertValid(document)
    print("Reference XSD validation passed:", path)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) == 2 else "examples/lilac.xml")
