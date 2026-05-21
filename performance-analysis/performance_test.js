import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    vus: parseInt(__ENV.VUS), // number of concurrent virtual users
    duration: '60s', // test duration
};

export default function () {
    const res = http.get(`${__ENV.URL}`);
    check(res, {
        'status is 200': (r) => r.status === 200,
    });
    sleep(1);
}