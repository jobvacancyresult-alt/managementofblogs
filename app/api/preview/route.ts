import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()

  const html = `
    <html>
      <head>
        <title>Preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        <!-- Same CSS as PHP -->
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
          }

          img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 16px 0;
          }

          h1,h2,h3,h4 {
            margin-top: 20px;
          }

          p {
            margin-bottom: 12px;
          }

          ul {
            padding-left: 20px;
          }

          table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
          }

          td, th {
            border: 1px solid #ccc;
            padding: 8px;
          }

          blockquote {
            border-left: 4px solid blue;
            padding: 10px;
            background: #f1f5f9;
          }
        </style>
      </head>

      <body>
        <h1>${body.title || ''}</h1>
        <p>${body.description || ''}</p>

        <div>
          ${body.content || ''}
        </div>
      </body>
    </html>
  `

  return NextResponse.json({ html })
}