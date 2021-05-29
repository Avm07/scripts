#!/usr/bin/env node
'use strict'

const program = require('commander');
const { Api, JsonRpc, RpcError, PublicKey } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const { TextEncoder, TextDecoder } = require('util');

program
    .requiredOption('--url [value]', 'EOSIO API URL')
    .requiredOption('--private-key [value]', 'Private key for signing transaction')
    .requiredOption('--new-account-name [value]', 'New account name')
    .requiredOption('--owner-pub-key [value]', 'Owner public key')
    .requiredOption('--active-pub-key [value]', 'Active public key')

program.parse(process.argv);

const { url, privateKey, newAccountName, ownerPubKey, activePubKey } = program.opts();

const sigProvider = new JsSignatureProvider([privateKey]);
const rpc = new JsonRpc(url, { fetch });
const api = new Api({
    rpc: rpc, signatureProvider: sigProvider,
    textDecoder: new TextDecoder(), textEncoder: new TextEncoder()
});

(async () => {
        try {
                console.log('Create new account: ', newAccountName, ownerPubKey, activePubKey);

                const result = await api.transact
                    (
                        {
                            actions:
                                [
                                    {
                                        account: 'eosio',
                                        name: 'newaccount',
                                        authorization: [{
                                          actor: 'eosio',
                                          permission: 'active',
                                        }],
                                        data: {
                                          creator: 'eosio',
                                          name: newAccountName,
                                          owner: {
                                            threshold: 1,
                                            keys: [{
                                              key: ownerPubKey,
                                              weight: 1
                                            }],
                                            accounts: [],
                                            waits: []
                                          },
                                          active: {
                                            threshold: 1,
                                            keys: [{
                                              key: activePubKey,
                                              weight: 1
                                            }],
                                            accounts: [],
                                            waits: []
                                          }
                                        }
                                      }
                                ]
                        },
                        {
                            blocksBehind: 3,
                            expireSeconds: 30
                        }
                    );
                console.log('Transaction id: ', result.transaction_id);
        }
        catch (e) {
            console.error('Transaction exception: ', e);
        }
})();
