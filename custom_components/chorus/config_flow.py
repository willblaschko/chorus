"""Config flow for Chorus — a single local, account-free instance."""
from __future__ import annotations

from homeassistant import config_entries

from .const import DOMAIN


class ChorusConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Chorus has no options to configure — it just needs to be enabled once."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="Chorus", data={})
        return self.async_show_form(step_id="user")
