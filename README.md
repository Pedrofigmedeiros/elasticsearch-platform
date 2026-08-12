# Elasticsearch Platform

## Description

Elasticsearch Platform is a modular search platform built on **Elasticsearch** for designing, developing, and experimenting with scalable, high-performance search solutions.

It provides reusable components for indexing, querying, relevance tuning, document management, and search APIs, making it easy to build search experiences across multiple business domains such as **e-commerce**, **marketplaces**, **real estate**, **CRM**, **HR systems**, and more.

Built with **NestJS** and **TypeScript**, the project follows a modular architecture inspired by production environments, serving both as a learning platform for Elasticsearch and as a foundation for developing reusable search services.

---

## Features

- Elasticsearch integration
- Generic Search API
- Index Management
- Document Management
- Data Indexing Pipeline
- Query DSL
- Dockerized Development Environment
- Modular NestJS Architecture

---

## Tech Stack

- NestJS
- TypeScript
- Elasticsearch
- Kibana
- Docker
- Docker Compose

---

## Project Setup

```bash
npm install
```

---

## Running the Project

### Start the Elastic Stack

```bash
docker compose up -d
```

### Development

```bash
npm run start api
```

### Watch Mode

```bash
npm run start:dev api
```

### Production

```bash
npm run start:prod api
```

---

## Running the Indexer

The `operations` app provides CLI scripts to manage indices and bulk-index documents from a CSV file into Elasticsearch.

### Create an index (and its alias)

```bash
npm run op:indices:create
```

### Bulk index documents from a CSV

```bash
npm run op:documents:bulk -- <path-to-csv> [alias]
```

Example:

```bash
npm run op:documents:bulk -- ./data/job_postings.csv jobs
```

The bulk indexing pipeline reads the CSV in streaming mode, transforms each row, and writes documents to Elasticsearch in batches:

```text
Reader → Transformer → Writer
  │          │            │
  │          │            └─ batches documents and calls the Elasticsearch bulk API (retry + timeout)
  │          └─ normalizes raw CSV values (dates → ISO 8601, "t"/"f" → boolean)
  └─ streams the CSV file row by row (AsyncGenerator, no full-file buffering)
```

- **Reader** (`documents/reader.ts`) — streams a CSV file and yields one row at a time.
- **Transformer** (`documents/transformer.ts`) — converts a raw row into a Document ready for indexing.
- **Writer** (`documents/writer.ts`) — batches documents and bulk-writes them to Elasticsearch, tracking successes/failures.
- **Processor** (`documents/processor.ts`) — wires Reader → Transformer → Writer together.
- **Runner** (`documents/runner.ts`) — CLI entry point: validates the target alias and runs the Processor.

---

## Running Tests

```bash
# Unit Tests
npm run test

# End-to-End Tests
npm run test:e2e

# Test Coverage
npm run test:cov
```

---

## Project Structure

```text
apps/
├── api/                     # Search API (NestJS app)
└── operations/              # CLI scripts: index management & bulk indexing
    └── src/
        ├── documents/       # Reader, Transformer, Writer, Processor, Runner
        └── indices/         # Index creation/mapping

libs/
├── config/                  # Environment configuration (ConfigService)
├── elastic/                 # Elasticsearch client, aliases, index mappings
├── jobs-search/             # Jobs search domain logic
└── typescript/              # Shared TS utilities (async iterators helpers)

data/                        # Sample CSV datasets for bulk indexing
```

---

## Roadmap

### Search

- [x] Elasticsearch Client Integration
- [x] Generic Search Operation
- [x] First Search Endpoint
- [ ] Generic Search Module
- [ ] Pagination
- [ ] Filtering
- [ ] Sorting
- [ ] Aggregations
- [ ] Highlighting
- [ ] Autocomplete

### Indexing

- [x] CSV Data Source Integration
- [x] Bulk Indexing (Reader → Transformer → Writer pipeline)
- [x] Document Transformation
- [ ] Incremental Synchronization

### Platform

- [x] Index Management
- [ ] Document Management
- [ ] Health Checks
- [ ] Metrics
- [ ] OpenTelemetry
- [ ] Multi-Cluster Support

---

## Project Goals

- Build a reusable search platform.
- Explore Elasticsearch in depth.
- Learn distributed search architectures.
- Develop production-ready search solutions.
- Create a reusable foundation that can be adapted to different business domains.
- Serve as a technical portfolio demonstrating backend engineering and Elasticsearch expertise.

---

## License

This project is licensed under the MIT License.
