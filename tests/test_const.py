"""Capability registry (const.py): model string -> capability decisions.

These lock the *observable* promises of the registry — which models can be a
home-theater primary, a sub, a surround/pair, or carry a height channel — and
the graceful-degradation contract for unknown/future models.
"""
import const


# --- soundbars: the only valid HT primaries -------------------------------
def test_arc_is_a_soundbar_primary():
    assert const.is_soundbar("Sonos Arc") is True
    assert const.capabilities("Sonos Arc") == {"family": "soundbar", "primary": True}


def test_beam_ray_playbar_playbase_are_soundbars():
    for model in ("Sonos Beam", "Sonos Ray", "Sonos Playbar", "Sonos Playbase"):
        assert const.is_soundbar(model) is True, model


def test_soundbars_are_not_surrounds_pairs_subs_or_height():
    # A soundbar row carries only {primary}: everything else is falsey.
    for model in ("Sonos Arc", "Sonos Beam"):
        assert const.can_surround(model) is False, model
        assert const.can_pair(model) is False, model
        assert const.is_sub(model) is False, model
        assert const.has_height(model) is False, model


# --- subs ------------------------------------------------------------------
def test_sub_and_sub_mini_are_subs():
    for model in ("Sonos Sub", "Sonos Sub Mini"):
        assert const.is_sub(model) is True, model


def test_a_sub_is_not_a_soundbar_primary():
    # A Sub must be rejected as an HT primary even though it is HT hardware.
    assert const.is_soundbar("Sonos Sub") is False
    assert const.is_soundbar("Sonos Sub Mini") is False


# --- surround / pair capable speakers -------------------------------------
def test_surround_and_pair_capable_models():
    for model in (
        "Sonos Era 300",
        "Sonos Era 100",
        "Sonos One",
        "Sonos One SL",
        "Sonos Five",
        "SYMFONISK Bookshelf",
    ):
        assert const.can_surround(model) is True, model
        assert const.can_pair(model) is True, model
        # ...but none of them is a soundbar or a sub.
        assert const.is_soundbar(model) is False, model
        assert const.is_sub(model) is False, model


# --- height (Atmos up-firing) ---------------------------------------------
def test_height_only_on_height_families():
    assert const.has_height("Sonos Era 300") is True
    # Era 300 is the height family; siblings and the bar itself are not.
    for model in ("Sonos Arc", "Sonos Era 100", "Sonos One", "Sonos Five",
                  "SYMFONISK Bookshelf"):
        assert const.has_height(model) is False, model


def test_era_300_full_capability_dict():
    assert const.capabilities("Sonos Era 300") == {
        "family": "home", "surround": True, "pair": True, "height": True,
    }


# --- portables: Move 2+ can surround (Sonos "Portable Surrounds") ----------
def test_move_2_can_surround_but_move_1_and_roam_cannot():
    # Move 2+ became home-theater-surround-capable; older portables did not.
    assert const.can_surround("Sonos Move 2") is True
    assert const.can_surround("Sonos Move 3") is True  # future Move N inherits it
    assert const.capabilities("Sonos Move 2")["family"] == "portable"
    for model in ("Sonos Move", "Sonos Roam", "Sonos Roam 2"):
        assert const.can_surround(model) is False, model
        assert const.capabilities(model) == {"family": "portable"}, model


def test_move_2_is_surround_only_not_pair_bar_or_sub():
    # Tagged `surround` only — not a standalone stereo pair, a soundbar, a sub, or height.
    assert const.capabilities("Sonos Move 2") == {"family": "portable", "surround": True}
    assert const.can_pair("Sonos Move 2") is False
    assert const.is_soundbar("Sonos Move 2") is False
    assert const.is_sub("Sonos Move 2") is False
    assert const.has_height("Sonos Move 2") is False


# --- unknown / future models degrade gracefully to the fallback -----------
def test_unknown_model_degrades_to_generic_home_speaker():
    caps = const.capabilities("Sonos Quantum 9000")  # does not exist
    assert caps == const._FALLBACK
    assert caps == {"family": "home", "surround": True, "pair": True}
    # A future speaker acts like a generic home speaker, not a crash.
    assert const.can_surround("Sonos Quantum 9000") is True
    assert const.can_pair("Sonos Quantum 9000") is True
    assert const.is_soundbar("Sonos Quantum 9000") is False
    assert const.is_sub("Sonos Quantum 9000") is False
    assert const.has_height("Sonos Quantum 9000") is False


def test_none_and_empty_model_do_not_crash():
    for model in (None, ""):
        assert const.capabilities(model) == const._FALLBACK
        assert const.is_soundbar(model) is False
        assert const.is_sub(model) is False
        assert const.can_surround(model) is True
