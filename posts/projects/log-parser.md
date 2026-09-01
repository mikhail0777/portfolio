---
title: "Dynamic Log Parser & Analysis Utility"
summary: "A lightweight, high-throughput log analysis tool built in Perl to process raw system log streams, extract key diagnostic events, and structure diagnostic summaries for rapid debugging."
coverImage: "/assets/log-parser-demo.png"
order: 6
---

A lightweight, high-throughput log analysis tool built in Perl to process raw system log streams, extract key diagnostic events, and structure diagnostic summaries for rapid debugging.

GitHub Repository: [github.com/mikhail0777/Log_Parser](https://github.com/mikhail0777/Log_Parser)

---

### Key Capabilities

* **Pattern Extraction & Regex Parsing:** Utilizes optimized Perl regular expressions to scan unstructured log streams, filtering error codes, severity levels, and execution timestamps.
* **Aggregated Reporting:** Groups recurring diagnostic warnings, failure modes, and stack traces into structured summary metrics.
* **Resource-Efficient Execution:** Designed with low memory overhead to rapidly digest large log files and continuous stdout streams.
* **CLI Flexibility:** Offers configurable command-line arguments to customize pattern matching, timestamp ranges, and output formatting on the fly.

---

### Technical Highlights

```yaml
Language: Perl 5
Focus Area: Text Processing, Regex Optimization, CLI Automation
Interface: Command-Line Interface (CLI)
```

### Problem & Engineering Solution

During hardware validation, simulation runs, or firmware build pipelines, logs grow exponentially in size. Manually sifting through multi-gigabyte log dumps to isolate root causes creates unnecessary friction in the debugging lifecycle. 

This utility automates log ingestion and filtering by applying targeted regular expressions to extract pertinent error signatures, timestamps, and error counts. Built in Perl—a mainstay in EDA toolchains and silicon validation environments—the script serves as an extensible foundation for automated build verification and regression triage pipelines.

---

### Key Skills Demonstrated

* **Perl File I/O & Text Manipulation:** Reading file handles, stream processing, and pattern matching.
* **Data Structures:** Hash map accumulators for frequency analysis and state tracking across system logs.
* **Automation Readiness:** Clean exit codes and stream handling for integration into broader CI/CD and automated test workflows.
