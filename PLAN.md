Module Federation Gateway Wants

Module federation gateway service for hosting/routing clients to modules

Clients ping a manifest
They get a manifest file, with a ETag hash

Clients periodically ping the manifest. Endpoint returns a 301 if not modified, or a new manifest if changed.
^ potentially return just a diff from the requested manifest hash. allowing incremental upgrades at scale.
Clients can upgrade from one version to the next in real time if the module allows
Modules are allowed to signal a full-page reload is required to upgrade.
App shell should provide UI to surface full-page reload is required.
Different routes can signal different modules should be used for this purpose (to keep within the theme of the page)

# Encrypted Module Content Preloading

This is a way to allow clients to preload modules that are due to go live at a future date, with
a decryption key becoming available after a given server time.

The content isn't strictly sensitive, it's just a way to deliver content to hardcore fans sooner for a more reliable experience.

ServiceWorker can cache encrypted content, which could be mf-gateway modules
we should allow content to be remotely wiped/updated during this time if we want to push a new version.
At the time of release, push notifications can provide decryption keys in their metadata (or a url to one) - or the sw client can fetch the decryption at a provided unlock time.

If a client asks for a decryption key too early, they are given the amount of time to wait to ask again - a fix for people with dodgy system dates.

Need some kind of lifecycle for the preload/decryption process, as well as ways of notifying the user of new content (ethically).

web push notifications containing decryption keys should be delivered slightly before the formal "unlock" time for better deliverability.

Consider Service Worker Background Sync

We will also need some kind of dashboard/management interface in the gateway to see:

How many clients have preloaded a module
How many clients have upgraded to a module (where applicable)
How many clients have decrypted a module
Whether any clients have made failed attempts to decrypt a module.
