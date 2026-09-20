+++
title = "Personal Software, Part I"
date = 2026-09-07
draft = true

[extra]
artbit = ""
+++

Posts in this series:

- Cryptography
- Blob Stores
- Logs
- Groups 
- Spaces
- CRDTs
- Registers
- Live Sync
- Home servers
- Communities
- Serverside compute
- Composition and interoperability
- Personal software, on demand

# Cryprography

Outline:

- What does it mean for something to be secure?
  - Threat models
    - Network
    - Disk
    - Corruption
- Primitives
  - Symmetric key cryptography
    - One time pads and xor
    - seeding a rng and xor
    - nonces
    - Xchachapoly1035
- Problem: how to communicate the symmetric key
  - chicken and egg
- Public key cryptography
  - Public and private keys
  - Key exchange for symmetric keys
  - Deriving private keys from passwords
  - StrKey
- Problem: how to verify that messages are from the right sender?
  - Replay attacks, etc
  - Solution: signatures
- Private key cryptography is 1:1. what about groups?
  - Envelopes, etc
  - Forward secrecy
  - Tradeoffs
- How do we make sure data hasn't been tampered with
  - Hashes
  - Error-correcting codes
- In the next section, we will discuss how to efficiently store data in blob stores

# Distributed Blob stores

Outline:
- Hashes
- Content-addressed stores, in-memory
- Abstracting the backend, on-disk storage
- Compression
- Problem: writing large files
- Solution: hash splitting
- Adler32 and fastcdc
- Problem: chunks are still large
- Solution: delta encoding of chunks before compression
- Problem: many blobs. how to communicate?
  - Sync protocol
  - Distributed hash table
- Open question: Blobs are immutable. What about mutable?
- Next: replicated logs

# Logs

Outline:
- Question: how to do a blob store for mutable data, keep track of most recent version
- Solution: sign a message with hash of most recent release
- Problem: what is the most recent, really? 
- Solution: number each release, single writer
- Problem, what about history?
  - Solution 1: publish list of all versions with each release
    - Fine if blob store because of delta encoding, etc.
  - Problem: but history can be tampered with
  - Solution 2: in each version, include hash of prior version; bitcoin
  - Problem: expensive to verify, have to download whole history
  - Solution: merkle tree, each version is root hash, can be traversed to recover full history, subtrees match hashes so can verify new version is consistent without reading whole tree
- Real-time sync, networking
- Later: snapshots to avoid needing to download whole history
- Question: this works fine for a single publisher. What if you have multiple publishers?
