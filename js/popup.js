const request = require('superagent');
const jsonp = require('superagent-jsonp');
const moment = require('moment');

const base_url = 'https://api.meetup.com/';
const group_name = 'staffswebmeetup';
const client_id = 'p18pgrpkk69nquq81c3he89p83';
const redirect_uri = chrome.extension.getURL('oauth.html');
let access_token = null;

const content = document.querySelector('#content');

chrome.storage.sync.get(null, items => {
    if(!items.access_token) {
        oauth.show();
    } else {
        access_token = items.access_token;
        group.show();
    }
});

const oauth = {
    show: () => {
        emptyContent();
        const btn = document.createElement('button');
        btn.classList.add('btn', 'btn--oauth');
        btn.textContent = 'Connect with Meetup.com'
        btn.addEventListener('click', oauth.authorize);
        content.appendChild(btn);
    },
    authorize: () => {
        const url = `https://secure.meetup.com/oauth2/authorize?client_id=${client_id}&response_type=token&redirect_uri=${redirect_uri}`;
        chrome.tabs.create({ url });
    },
    get: (endpoint, query) => {
        return new Promise((resolve, reject) => {
            return request.get(base_url + endpoint)
                .query({ access_token})
                .query(query)
                .use(jsonp({ timeout: 10000 }))
                .then(res => {
                    if(res.body.data && !res.body.data.errors) {
                        resolve(res.body.data);
                    } else {
                        const errors = res.body.data.errors
                        if(errors[0] && errors[0].code == 'auth_fail') {
                            oauth.show();
                        } else {
                            console.error(errors);
                        }
                    }
                });
        });
    }
};

const group = {
    show: () => {
        oauth.get(group_name)
            .then(group => {
                if(group.next_event) {
                    event.load(group.next_event.id);
                } else {
                    // TODO: event.none();
                }
            })
            .catch(err => {
                // TODO: Display error
            });
    }
};

const event = {
    load: id => {
        oauth.get(group_name + '/events/' + id)
            .then(ev => {
                event.display(ev);
            });
    },
    display: event => {
        emptyContent();

        const name = document.createElement('h2');
        const nameLink = document.createElement('a');
        nameLink.setAttribute('href', event.link);
        nameLink.setAttribute('target', '_blank');
        nameLink.setAttribute('rel', 'noopener');
        nameLink.textContent = event.name;
        name.appendChild(nameLink);
        content.appendChild(name);

        const when = document.createElement('div');
        const date = document.createElement('h3');
        date.classList.add('date');
        const eventTime = moment(event.time);
        date.textContent = eventTime.format('dddd, MMMM Do YYYY');
        when.appendChild(date);
        const time = document.createElement('p')
        time.classList.add('time');
        time.textContent = eventTime.format('h:mm A');
        when.appendChild(time);
        createEventMeta('clock', when);

        const rsvps = document.createElement('div');
        const going = document.createElement('h3');
        going.textContent = event.yes_rsvp_count + ' going';
        rsvps.appendChild(going);
        const limit = document.createElement('p');
        limit.textContent = event.rsvp_limit + ' limit';
        rsvps.appendChild(limit);
        createEventMeta('ticket', rsvps);

        const venue = document.createElement('div');
        const venueName = document.createElement('h3');
        const venueLink = document.createElement('a');
        venueLink.textContent = event.venue.name;
        venueLink.setAttribute('href', `https://maps.google.com/maps?f=q&hl=en&q=${event.venue.address_1}+${event.venue.city}+${event.venue.country}`);
        venueLink.setAttribute('target', '_blank');
        venueLink.setAttribute('rel', 'noopener');
        venueName.appendChild(venueLink);
        venue.appendChild(venueName);
        const address = document.createElement('p');
        address.textContent = `${event.venue.address_1}, ${event.venue.address_2}, ${event.venue.city}`;
        venue.appendChild(address);
        createEventMeta('venue', venue);
    }
};

const createEventMeta = (iconName, contentDiv) => {
    const meta = document.createElement('div');
    meta.classList.add('event__meta');
    const icon = document.createElement('span');
    icon.classList.add('icon', `icon__${iconName}`);
    meta.appendChild(icon);
    meta.appendChild(contentDiv);
    content.appendChild(meta);
};

const emptyContent = () => {
    while(content.hasChildNodes()) {
        content.removeChild(content.lastChild);
    }
};
