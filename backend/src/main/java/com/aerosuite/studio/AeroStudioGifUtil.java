package com.aerosuite.studio;

import com.aerosuite.i18n.ApiI18nMessages;

import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Iterator;
import java.util.List;

/** Monta GIF animado a partir de frames PNG. */
public final class AeroStudioGifUtil {

    private AeroStudioGifUtil() {}

    public static byte[] encodeGif(List<byte[]> pngFrames, int delayCentisec) throws Exception {
        if (pngFrames == null || pngFrames.isEmpty()) {
            return new byte[0];
        }
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("gif");
        if (!writers.hasNext()) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_GIF_WRITER_UNAVAILABLE));
        }
        ImageWriter writer = writers.next();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
            writer.setOutput(ios);
            writer.prepareWriteSequence(null);
            ImageWriteParam param = writer.getDefaultWriteParam();
            for (byte[] frame : pngFrames) {
                BufferedImage img = ImageIO.read(new ByteArrayInputStream(frame));
                if (img == null) {
                    continue;
                }
                writer.writeToSequence(new javax.imageio.IIOImage(img, null, null), param);
            }
            writer.endWriteSequence();
        } finally {
            writer.dispose();
        }
        return baos.toByteArray();
    }
}
