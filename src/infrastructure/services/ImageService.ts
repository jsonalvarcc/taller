import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export class ImageService {
    private static readonly UPLOAD_DIR = join(process.cwd(), 'public', 'images');

    static async saveImage(file: File): Promise<string> {
        try {
            // Ensure directory exists
            await mkdir(this.UPLOAD_DIR, { recursive: true });

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileExtension = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExtension}`;
            const filePath = join(this.UPLOAD_DIR, fileName);

            await writeFile(filePath, buffer);

            return `/images/${fileName}`;
        } catch (error) {
            console.error('Error saving image:', error);
            throw new Error('Failed to save image locally');
        }
    }

    static async saveImages(files: File[]): Promise<string[]> {
        return Promise.all(files.map(file => this.saveImage(file)));
    }
}
