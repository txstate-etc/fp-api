#!/bin/sh

mongoimport --host mongodb --db facultyprofiles --collection people --upsert --type json --file /people.json --jsonArray || exit $?
mongoimport --host mongodb --db facultyprofiles --collection activities --upsert --type json --file /activities.json --jsonArray || exit $?
