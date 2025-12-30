import { ImageAnnotatorClient } from '@google-cloud/vision';
import { NextRequest, NextResponse } from 'next/server';
import { parseExpirationDate } from '@/lib/utils/expiration';

// Initialize Vision client with credentials from environment
function getVisionClient() {
    const credentials = {
        projectId: process.env.GOOGLE_VISION_PROJECT_ID,
        credentials: {
            client_email: process.env.GOOGLE_VISION_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_VISION_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
    };

    return new ImageAnnotatorClient(credentials);
}

export async function POST(request: NextRequest) {
    try {
        const { image, images } = await request.json();

        // Support both single image (legacy) and multiple images
        const imageList = images || (image ? [image] : []);

        if (imageList.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No se proporcionaron imágenes' },
                { status: 400 }
            );
        }

        // Initialize Vision client
        const client = getVisionClient();

        let bestProductCode: string | null = null;
        let bestExpirationDate: string | null = null;
        let combinedRawText = '';

        // Process all images
        for (const imgStr of imageList) {
            // Remove data URL prefix if present
            const base64Image = imgStr.replace(/^data:image\/\w+;base64,/, '');

            try {
                const [result] = await client.textDetection({
                    image: { content: base64Image },
                });

                const detections = result.textAnnotations;
                if (detections && detections.length > 0) {
                    const fullText = detections[0].description || '';
                    combinedRawText += fullText + '\n---\n';

                    const { productCode, expirationDate } = extractProductData(fullText);

                    // Update best results if we found something new
                    if (!bestProductCode && productCode) {
                        bestProductCode = productCode;
                    }
                    if (!bestExpirationDate && expirationDate) {
                        bestExpirationDate = expirationDate;
                    }
                }
            } catch (err) {
                console.error('Error processing one of the images:', err);
                // Continue to next image
            }
        }

        if (!bestProductCode && !bestExpirationDate) {
            return NextResponse.json({
                success: false,
                productCode: null,
                expirationDate: null,
                rawText: combinedRawText,
                error: 'No se detectó información relevante en las imágenes',
            });
        }

        return NextResponse.json({
            success: true,
            productCode: bestProductCode,
            expirationDate: bestExpirationDate,
            rawText: combinedRawText,
        });
    } catch (error) {
        console.error('OCR Error:', error);
        return NextResponse.json(
            {
                success: false,
                productCode: null,
                expirationDate: null,
                rawText: '',
                error: 'Error al procesar las imágenes',
            },
            { status: 500 }
        );
    }
}

function extractProductData(text: string): {
    productCode: string | null;
    expirationDate: string | null;
} {
    const lines = text.split('\n').map((line) => line.trim());

    let productCode: string | null = null;
    let expirationDate: string | null = null;

    // Patterns for product codes (alphanumeric, typically 6-20 characters)
    const codePatterns = [
        /\b([A-Z0-9]{6,20})\b/i,
        /(?:LOT|LOTE|COD|CODE|REF)[\s:.-]*([A-Z0-9-]{4,20})/i,
        /\b(\d{12,14})\b/, // Barcode numbers
    ];

    // Date patterns
    // Date patterns
    const datePatterns = [
        // Spanish Months: ABR2026, NOV 2024, ENE.25
        /\b(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[A-Z]*\.?\s*(\d{2,4})\b/i,

        // V, EXP, VTO... followed by date
        /(?:|V|EXP|VTO|VENCE|CAD|CADUCIDAD|EXPIRY|EXPIRA)[\s:.-]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
        /(?:|V|EXP|VTO|VENCE|CAD|CADUCIDAD|EXPIRY|EXPIRA)[\s:.-]*(\d{1,2}[\/\-\.]\d{2,4})/i,

        // LOT + Numeric Date Sequence (e.g., 2123764 12 27 -> Month 12 Year 27)
        // Look for digits followed by spaces then MM YY
        /\b\d{4,}\s+(\d{1,2})\s+(\d{2})\b/,

        // Standalone dates
        /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/,
        /\b(\d{1,2}[\/\-\.]\d{4})\b/,
        // YYYY-MM-DD
        /\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/,
    ];

    // Search for product code
    for (const line of lines) {
        for (const pattern of codePatterns) {
            const match = line.match(pattern);
            if (match && !productCode) {
                productCode = match[1] || match[0];
                break;
            }
        }
        if (productCode) break;
    }

    // Search for expiration date
    // Normalize newlines to spaces for multiline regex support
    const fullText = text.replace(/\n/g, ' ');

    for (const pattern of datePatterns) {
        const match = fullText.match(pattern);
        if (match) {
            // Case 1: Spanish Month (Match 1=Month, Match 2=Year)
            if (match.length === 3 && isNaN(Number(match[1]))) {
                const dateStr = `${match[1]} ${match[2]}`;
                const parsedDate = parseExpirationDate(dateStr);
                if (parsedDate) {
                    expirationDate = parsedDate.toISOString().split('T')[0];
                    break;
                }
            }
            // Case 2: Numeric Sequence (Match 1=Month, Match 2=Year) - e.g. "12 27"
            else if (match.length === 3 && !isNaN(Number(match[1]))) {
                const dateStr = `${match[1]}/${match[2]}`; // Convert 12 27 to 12/27
                const parsedDate = parseExpirationDate(dateStr);
                if (parsedDate) {
                    expirationDate = parsedDate.toISOString().split('T')[0];
                    break;
                }
            }
            // Case 3: Standard Single Match
            else {
                const parsedDate = parseExpirationDate(match[1]);
                if (parsedDate) {
                    // Format as YYYY-MM-DD for database storage
                    expirationDate = parsedDate.toISOString().split('T')[0];
                    break;
                }
            }
        }
    }

    return { productCode, expirationDate };
}
