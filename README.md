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

```bash
npm run start indexer
```

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
├── api/
└── indexer/

libs/
├── config/
├── elasticsearch/
├── product-search/
├── observability/
└── shared/

elasticsearch/
├── analyzers/
├── mappings/
├── index-templates/
└── queries/

data/
docker/
docs/
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

- [ ] Database Integration
- [ ] Bulk Indexing
- [ ] Incremental Synchronization
- [ ] Document Transformation

### Platform

- [ ] Index Management
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
