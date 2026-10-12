using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;

public class SpriteExtractor
{
    public static void ProcessSheet(string srcPath, string targetDir, string[] fileNames)
    {
        Directory.CreateDirectory(targetDir);
        using (Bitmap bmp = new Bitmap(srcPath))
        {
            int cellW = bmp.Width / 4;
            int cellH = bmp.Height / 2;

            int index = 0;
            for (int row = 0; row < 2; row++)
            {
                for (int col = 0; col < 4; col++)
                {
                    int startX = col * cellW;
                    int startY = row * cellH;

                    // 1. Crop raw cell
                    using (Bitmap cell = new Bitmap(cellW, cellH, PixelFormat.Format32bppArgb))
                    {
                        using (Graphics g = Graphics.FromImage(cell))
                        {
                            g.DrawImage(bmp, new Rectangle(0, 0, cellW, cellH), new Rectangle(startX, startY, cellW, cellH), GraphicsUnit.Pixel);
                        }

                        // 2. Identify ONLY external background pixels using BFS from outer frame
                        bool[,] isBg = new bool[cellW, cellH];
                        bool[,] visited = new bool[cellW, cellH];
                        Queue<Point> q = new Queue<Point>();

                        // Border seeds
                        for (int x = 0; x < cellW; x++)
                        {
                            CheckAndEnqueue(cell, x, 0, cellW, cellH, isBg, visited, q);
                            CheckAndEnqueue(cell, x, cellH - 1, cellW, cellH, isBg, visited, q);
                        }
                        for (int y = 0; y < cellH; y++)
                        {
                            CheckAndEnqueue(cell, 0, y, cellW, cellH, isBg, visited, q);
                            CheckAndEnqueue(cell, cellW - 1, y, cellW, cellH, isBg, visited, q);
                        }

                        int[] dx = { 1, -1, 0, 0 };
                        int[] dy = { 0, 0, 1, -1 };

                        while (q.Count > 0)
                        {
                            Point pt = q.Dequeue();
                            for (int i = 0; i < 4; i++)
                            {
                                int nx = pt.X + dx[i];
                                int ny = pt.Y + dy[i];
                                if (nx >= 0 && nx < cellW && ny >= 0 && ny < cellH && !visited[nx, ny])
                                {
                                    visited[nx, ny] = true;
                                    Color c = cell.GetPixel(nx, ny);
                                    // Light background test
                                    if (c.R >= 232 && c.G >= 232 && c.B >= 232)
                                    {
                                        isBg[nx, ny] = true;
                                        q.Enqueue(new Point(nx, ny));
                                    }
                                }
                            }
                        }

                        // 3. Build transparent sprite with de-fringing
                        int minX = cellW, maxX = 0, minY = cellH, maxY = 0;
                        using (Bitmap outBmp = new Bitmap(cellW, cellH, PixelFormat.Format32bppArgb))
                        {
                            for (int y = 0; y < cellH; y++)
                            {
                                for (int x = 0; x < cellW; x++)
                                {
                                    if (isBg[x, y])
                                    {
                                        outBmp.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
                                    }
                                    else
                                    {
                                        Color c = cell.GetPixel(x, y);

                                        // Edge check for feathering / anti-aliasing against background
                                        bool isEdge = (x > 0 && isBg[x - 1, y]) ||
                                                      (x < cellW - 1 && isBg[x + 1, y]) ||
                                                      (y > 0 && isBg[x, y - 1]) ||
                                                      (y < cellH - 1 && isBg[x, y + 1]);

                                        if (isEdge && c.R >= 220 && c.G >= 220 && c.B >= 220)
                                        {
                                            // Soft alpha transition
                                            float brightness = (c.R + c.G + c.B) / 3f;
                                            int alpha = (int)(255f * (245f - brightness) / 25f);
                                            if (alpha < 0) alpha = 0;
                                            if (alpha > 255) alpha = 255;
                                            outBmp.SetPixel(x, y, Color.FromArgb(alpha, c.R, c.G, c.B));
                                        }
                                        else
                                        {
                                            // Keep 100% opaque for internal colors (teeth, eyes, shirts, sparks)
                                            outBmp.SetPixel(x, y, Color.FromArgb(255, c.R, c.G, c.B));
                                        }

                                        if (x < minX) minX = x;
                                        if (x > maxX) maxX = x;
                                        if (y < minY) minY = y;
                                        if (y > maxY) maxY = y;
                                    }
                                }
                            }

                            // 4. Crop with slight padding
                            if (maxX > minX && maxY > minY)
                            {
                                int pad = 6;
                                int tx = Math.Max(0, minX - pad);
                                int ty = Math.Max(0, minY - pad);
                                int tw = Math.Min(cellW - tx, (maxX - minX + 1) + pad * 2);
                                int th = Math.Min(cellH - ty, (maxY - minY + 1) + pad * 2);

                                using (Bitmap cropped = new Bitmap(tw, th, PixelFormat.Format32bppArgb))
                                {
                                    using (Graphics gc = Graphics.FromImage(cropped))
                                    {
                                        gc.DrawImage(outBmp, new Rectangle(0, 0, tw, th), new Rectangle(tx, ty, tw, th), GraphicsUnit.Pixel);
                                    }

                                    string outPath = Path.Combine(targetDir, fileNames[index] + ".png");
                                    cropped.Save(outPath, ImageFormat.Png);
                                    Console.WriteLine("Saved: " + fileNames[index] + " (" + tw + "x" + th + ")");
                                }
                            }
                        }
                    }
                    index++;
                }
            }
        }
    }

    private static void CheckAndEnqueue(Bitmap bmp, int x, int y, int w, int h, bool[,] isBg, bool[,] visited, Queue<Point> q)
    {
        if (!visited[x, y])
        {
            Color c = bmp.GetPixel(x, y);
            if (c.R >= 230 && c.G >= 230 && c.B >= 230)
            {
                visited[x, y] = true;
                isBg[x, y] = true;
                q.Enqueue(new Point(x, y));
            }
        }
    }
}
