"""_parse_model (sonos.py): device-description XML -> canonical model name.

A Sonos device description embeds several UPnP sub-devices, each with its own
<modelName>; the root device (first) is the real model. Inputs -> outputs; the
HTTP fetch itself (device_description/fetch_model transport) is not exercised.
"""
from sonos import SonosBackend

# Trimmed real shape: root modelName first, then an embedded MediaServer's.
DESC = (
    "<root><device>"
    "<friendlyName>10.0.0.1 - Sonos Arc SL - RINCON_X</friendlyName>"
    "<modelNumber>S34</modelNumber>"
    "<modelDescription>Sonos Arc SL</modelDescription>"
    "<modelName>Sonos Arc SL</modelName>"
    "<displayName>Arc SL</displayName>"
    "<deviceList><device>"
    "<modelName>Sonos Arc SL Media Server</modelName>"
    "</device></deviceList>"
    "</device></root>"
)


def test_returns_root_model_name_not_embedded_subdevice():
    assert SonosBackend._parse_model(DESC) == "Sonos Arc SL"


def test_falls_back_to_display_name_then_description():
    only_display = "<root><displayName>Sub Mini</displayName></root>"
    assert SonosBackend._parse_model(only_display) == "Sub Mini"
    only_desc = "<root><modelDescription>Sonos Five</modelDescription></root>"
    assert SonosBackend._parse_model(only_desc) == "Sonos Five"


def test_empty_or_missing_yields_empty_string():
    assert SonosBackend._parse_model("") == ""
    assert SonosBackend._parse_model("<root><foo>bar</foo></root>") == ""
    assert SonosBackend._parse_model("<root><modelName></modelName></root>") == ""
