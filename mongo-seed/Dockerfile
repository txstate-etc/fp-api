FROM mongo:latest

COPY run.sh /run.sh
COPY data/people.json /people.json
COPY data/activities.json /activities.json
COPY data/files /seed-files

CMD ["/run.sh"]
