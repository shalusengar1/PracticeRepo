import { Storage } from '@google-cloud/storage';

const storage = new Storage({
    keyFilename: '/etc/google/key.json',
});

const bucketName = 'your-bucket-name'; 
const bucket = storage.bucket(bucketName);

export { storage, bucket, bucketName };
