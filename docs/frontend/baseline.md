# UI baseline and verification boundaries

The initial screen uses a green palette, a large text editor and two sharing/join
panels. The baseline matrix captures 320, 390, 768, 1024 and 1440 px layouts and
reports horizontal overflow and automated accessibility findings independently.

Generated screenshots and reports stay in ignored artifacts. Automated findings
are a starting point for contrast, labels and focus work, not a screen-reader
certification. The two-context room journey checks actual cross-device behavior
without introducing accounts or persistent browser state.

Manual screen-reader, physical QR-camera scanning and real mobile keyboard
behavior remain separate checks. No manual pass is inferred from browser emulation.
