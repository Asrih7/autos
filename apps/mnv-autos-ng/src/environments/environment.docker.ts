export const environment = {
    production: false,
    sso: {
        url: "https://keycloak-ssointerno-inte.apps.ocp-tst.caser.local/auth/",
        realm: "integration",
        clientId: "front-desktop"
    },
    versionTag: "DOCKER",
    test: "test-environment",
    configFile: 'assets/config/config.json',

    apiPaths: {
        login: '/mnv-seguridad-sb/auth/login',
        autos: '/mnv-autos-sb/autos'
    },
    technicalCredentials: {
        usuario: 'AC_ASIST_PYMES',
        "password": "Entra2026**"
    }
};
