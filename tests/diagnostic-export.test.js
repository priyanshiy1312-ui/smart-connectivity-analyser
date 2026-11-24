const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
    buildDiagnosticExport,
    downloadDiagnosticJSON
} = require("../js/script.js");

const completeResult = {
    timestamp: "2026-11-24T08:30:00.000Z",
    download_mbps: 0,
    upload_mbps: 12.5,
    ping_ms: 20,
    jitter_ms: 2,
    packet_loss: 0,
    connectivity_score: 85,
    network_type: "Wi-Fi",
    latitude: 26.9,
    longitude: 75.8,
    password: "must-not-export"
};

describe("Diagnostic JSON export", () => {
    it("builds a completed diagnostic with genuine zero values preserved", () => {
        const result = buildDiagnosticExport(completeResult);

        assert.equal(result.schema_version, "1.0.0");
        assert.equal(result.test_status, "completed");
        assert.equal(result.metrics.download_mbps, 0);
        assert.equal(result.metrics.packet_loss_percent, 0);
        assert.equal(result.metrics.upload_mbps, 12.5);
    });

    it("represents unavailable metrics as null in partial results", () => {
        const result = buildDiagnosticExport({
            ...completeResult,
            upload_mbps: null,
            jitter_ms: undefined
        });

        assert.equal(result.test_status, "partial");
        assert.equal(result.metrics.upload_mbps, null);
        assert.equal(result.metrics.jitter_ms, null);
    });

    it("excludes precise location and unrelated sensitive fields", () => {
        const result = buildDiagnosticExport(completeResult);
        const serialized = JSON.stringify(result);

        assert.equal(serialized.includes("latitude"), false);
        assert.equal(serialized.includes("longitude"), false);
        assert.equal(serialized.includes("password"), false);
        assert.equal(serialized.includes("75.8"), false);
    });

    it("rejects a missing diagnostic result", () => {
        assert.throws(() => buildDiagnosticExport(null), TypeError);
    });

    it("returns false when the browser download fails", () => {
        const environment = {
            Blob: class {
                constructor() {}
            },
            URL: {
                createObjectURL() {
                    throw new Error("Simulated download failure");
                },
                revokeObjectURL() {}
            },
            document: {
                createElement() {
                    return {};
                },
                body: null
            }
        };

        assert.equal(
            downloadDiagnosticJSON(completeResult, environment),
            false
        );
    });
});
