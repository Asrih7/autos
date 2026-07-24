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
        vehiculo: '/mnv-autos-sb/autos'
    },
    technicalCredentials: {
        usuario: 'agentePM1Col',
        password: 'Entra1234*'
    }
};
