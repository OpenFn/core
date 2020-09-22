const assert = require('assert');
const Execute_noCLI = require('../lib/execute_noCLI');

describe("Execute_noCLI", () => {
    it("expects an expression", () => {
        assert.throws(
            () => { Execute_noCLI() },
            /Cannot execute without an expression./
        )
    })

    it("expects an initial state", () => {
        assert.throws(
            () => { Execute_noCLI({ expression: "foo" }) },
            /Cannot execute without an initial state./
        )
    })

    describe("when given an expression and state", () => {
        it("returns", async () => {
            let result = await Execute_noCLI(
                `
                alterState(state => {
                    return state.num + 1
                 })`,
                {"num": 1},
                'language-dhis2'
            )
            assert.equal(result, 2)
        })
    })

    describe("when given an expression and state to interact with end server", () => {
        it("returns", async () => {
            let result = await Execute_noCLI(
                `createTEI({
              trackedEntityType: 'nEenWmSyUEp',
              orgUnit: 'g8upMTyEZGZ',
              attributes: [
                {
                  attribute: 'w75KJ2mc4zz', // Attribute Id for FirstName in DHIS2
                  value: state.form.case.update.patient_first_name //Question in CommCare form
                },
                {
                  attribute: 'zDhUuAYrxNC', // LastName attribute
                  value: state.form.case.update.patient_family_name
                },
                  {
                    attribute: "h5FuguPFF2j", // Case Id
                    value: state.id
                  }/*,
                  {
                    "attribute": "KdQqUHPqlqM", // Case Status
                    "value": dataValue("form.case.update.patient_case_status")(state)
                  }*/
              ],
              enrollments: [
                {
                  orgUnit: 'g8upMTyEZGZ',
                  program: 'IpHINAT79UW', //enroll in Child program
                  enrollmentDate: state.received_on.substring(0, 9),
                  incidentDate: state.metadata.timeStart.substring(0, 9)
                }
              ]
            })`,
                {
                    "__query_params": {
                        "app_id": "fdebe34cd56645ccad72bb606cfb4368"
                    },
                    "app_id": "fdebe34cd56645ccad72bb606cfb4368",
                    "archived": false,
                    "attachments": {
                        "form.xml": {
                            "content_type": "text/xml",
                            "length": 1982,
                            "url": "https://www.commcarehq.org/a/commcare-demo-2035/api/form/attachment/f70831ae-863f-4a20-909f-e0ffacebd85e/form.xml"
                        }
                    },
                    "data" : {
                        "trackedEntityType" : {
                            "lZGmxYbs97q" : 7891210
                        },
                        "csvData": {
                            "Org Unit UID" : "g8upMTyEZGZ",
                            "Org Unit" : "Njandama MCHP",
                            "firstName" : "John",
                            "lZGmxYbs97q" : 7891210,
                            "ScSWoiqvdp5" : "f70831ae-863f-4a20-909f-e0ffacebd85e",
                            "B6TnnFMgmCk" : 94,
                            "START DATE (MM/YY)" : "2020-04-21T18:51:06.456000Z"
                        }
                    },
                    "build_id": null,
                    "domain": "commcare-demo-2035",
                    "edited_by_user_id": null,
                    "edited_on": null,
                    "form": {
                        "#type": "data",
                        "@name": "Register to Child Program",
                        "@uiVersion": "1",
                        "@version": "2",
                        "@xmlns": "http://openrosa.org/formdesigner/158EB23A-DCFF-4680-90DA-A52D95628A8C",
                        "case": {
                            "@case_id": "4f5ac5a4-b624-4d0d-8a50-73500d1862c5",
                            "@date_modified": "2020-04-21T18:52:00.482000Z",
                            "@user_id": "cbc657317f74c7711d167f916afcf966",
                            "@xmlns": "http://commcarehq.org/case/transaction/v2",
                            "create": {
                                "case_name": "Msikinya, Rachel",
                                "case_type": "covid_19_case",
                                "owner_id": "cbc657317f74c7711d167f916afcf966"
                            },
                            "update": {
                                "patient_case_status": "confirmed",
                                "patient_family_name": "Msikinya",
                                "patient_first_name": "Rachel",
                                "patient_name_last_first": "Msikinya, Rachel",
                                "unique_case_id": "BONRESR"
                            }
                        },
                        "consent_list": {
                            "consent_confirmation": "yes"
                        },
                        "meta": {
                            "@xmlns": "http://openrosa.org/jr/xforms",
                            "appVersion": "Formplayer Version: 2.47",
                            "app_build_version": null,
                            "commcare_version": null,
                            "deviceID": "Formplayer",
                            "drift": "0",
                            "geo_point": null,
                            "instanceID": "f70831ae-863f-4a20-909f-e0ffacebd85e",
                            "timeEnd": "2020-04-21T18:52:00.482000Z",
                            "timeStart": "2020-04-21T18:51:06.456000Z",
                            "userID": "cbc657317f74c7711d167f916afcf966",
                            "username": "aleksa@openfn.org"
                        },
                        "patient_identifier_information": {
                            "basic_demo": {
                                "patient_family_name": "Msikinya",
                                "patient_first_name": "Rachel"
                            },
                            "confirmed": {
                                "confirm_label": "",
                                "confirmed_label": ""
                            },
                            "covid_id": {
                                "auto_uid": "BONRESR",
                                "auto_uid_label": "",
                                "manual_or_auto": "generate",
                                "unique_case_id": "BONRESR"
                            },
                            "patient_case_status": "confirmed",
                            "patient_name_last_first": "Msikinya, Rachel"
                        }
                    },
                    "id": "f70831ae-863f-4a20-909f-e0ffacebd85e",
                    "indexed_on": "2020-04-21T18:52:01.323139",
                    "initial_processing_complete": true,
                    "is_phone_submission": true,
                    "metadata": {
                        "appVersion": "Formplayer Version: 2.47",
                        "app_build_version": null,
                        "commcare_version": null,
                        "deviceID": "Formplayer",
                        "drift": "0",
                        "geo_point": null,
                        "instanceID": "f70831ae-863f-4a20-909f-e0ffacebd85e",
                        "location": null,
                        "timeEnd": "2020-04-21T18:52:00.482000Z",
                        "timeStart": "2020-04-21T18:51:06.456000Z",
                        "userID": "cbc657317f74c7711d167f916afcf966",
                        "username": "aleksa@openfn.org"
                    },
                    "problem": null,
                    "received_on": "2020-04-21T18:52:00.654283Z",
                    "resource_uri": "",
                    "server_modified_on": "2020-04-21T18:52:00.820344Z",
                    "type": "data",
                    "uiversion": "1",
                    "version": "2",
                    "configuration" : {
                        "username" : "admin",
                        "password" : "district",
                        "hostUrl"  : "https://play.dhis2.org/2.34.1"
                    }
                },
                '../../languages/language-dhis2.Adaptor'
            )
            assert.equal(result.httpStatusCode, 200)
        })
    })


})