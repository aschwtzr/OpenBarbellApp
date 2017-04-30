// app/utility/GoogleDriveUploader.js

// TODO: tweak this so setting up upload is separate from actually uploading
// Also split it up so resume is doable

import * as Errors from '../utility/Errors';

export const upload = async (accessToken, name, content, completionHandler) => {
    // setup the upload
    let response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Upload-Content-Type': 'text/csv',
            'X-Upload-Content-Length': content.length,
            'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify({
            "name": name
        })
    });
    let status = await response.status;

    // error check
    if (status !== 200) {
        let json = await response.json();
        console.log('Error, received status ' + status + ' body ' + JSON.stringify(json));
        if (status === 403 && json.error !== undefined && json.error.message === 'Insufficient Permission') {
            throw new Errors.PermissionsError('Insufficient Permission')
        } else {
            throw new Error('Did not receive 200 for setup upload');
        }
    }

    // actually upload the spreadsheet
    let location = response.headers.get('Location');
    response = await fetch(location, {
        method: 'PUT',
        headers: {
            'Content-Length' : content.length,
            'Content-Type' : 'text/csv'
        },
        body: content
    });
    status = await response.status;

    // error check
    if (status !== 200) {
        let json = await response.json();
        console.log('Error, received status ' + status + ' body ' + JSON.stringify(json));
        throw new Error('Did not receive 200 for upload');
    }

    if (completionHandler !== undefined) {
        let json = await response.json();
        completionHandler(json.id);
    }
};