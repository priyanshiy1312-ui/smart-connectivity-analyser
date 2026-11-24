const test = require("node:test");
const assert = require("node:assert/strict");

const {
    getBrowserCapabilityDiagnostics
} = require("../js/script.js");

function createEnvironment({
    geolocation = true,
    networkInformation = true,
    onlineStatus = true,
    localStorage = true
} = {}) {
    const navigator = {};

    if (geolocation) {
        navigator.geolocation = {
            getCurrentPosition() {}
        };
    }

    if (networkInformation) {
        navigator.connection = {};
    }

    if (onlineStatus) {
        navigator.onLine = true;
    }

    const environment = { navigator };

    if (localStorage) {
        environment.localStorage = {
            getItem() { return null; },
            setItem() {}
        };
    }

    return environment;
}

test("reports supported browser capabilities", () => {
    const results = getBrowserCapabilityDiagnostics(
        createEnvironment()
    );

    assert.equal(results.find(item => item.id === "geolocation").status, "supported");
    assert.equal(results.find(item => item.id === "networkInformation").status, "supported");
    assert.equal(results.find(item => item.id === "onlineStatus").status, "supported");
    assert.equal(results.find(item => item.id === "localStorage").status, "supported");
});

test("reports unsupported browser capabilities without blocking other features", () => {
    const results = getBrowserCapabilityDiagnostics(
        createEnvironment({
            geolocation: false,
            networkInformation: false,
            onlineStatus: false,
            localStorage: false
        })
    );

    assert.ok(results.every(item => item.status === "unsupported"));
    assert.equal(results.length, 4);
});

test("distinguishes denied location permission from unsupported geolocation", () => {
    const results = getBrowserCapabilityDiagnostics(
        createEnvironment(),
        "denied"
    );

    assert.equal(
        results.find(item => item.id === "geolocation").status,
        "permission-denied"
    );

    assert.equal(
        results.find(item => item.id === "networkInformation").status,
        "supported"
    );
});

test("reports unavailable storage when browser storage access throws", () => {
    const environment = {
        navigator: {
            onLine: true
        }
    };

    Object.defineProperty(environment, "localStorage", {
        get() {
            throw new Error("Storage access blocked");
        }
    });

    const results = getBrowserCapabilityDiagnostics(environment);

    assert.equal(
        results.find(item => item.id === "localStorage").status,
        "unsupported"
    );
});
