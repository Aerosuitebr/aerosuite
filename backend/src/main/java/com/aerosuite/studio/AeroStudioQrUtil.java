package com.aerosuite.studio;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;

public final class AeroStudioQrUtil {

    private AeroStudioQrUtil() {}

    public static String toDataUriPng(String data, int size) {
        if (data == null || data.isBlank()) {
            return "";
        }
        try {
            int px = Math.max(80, size);
            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);
            BitMatrix matrix = new QRCodeWriter().encode(data, BarcodeFormat.QR_CODE, px, px, hints);
            BufferedImage image = new BufferedImage(px, px, BufferedImage.TYPE_INT_RGB);
            for (int x = 0; x < px; x++) {
                for (int y = 0; y < px; y++) {
                    image.setRGB(x, y, matrix.get(x, y) ? 0xFF000000 : 0xFFFFFFFF);
                }
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (WriterException | java.io.IOException e) {
            return "";
        }
    }
}
