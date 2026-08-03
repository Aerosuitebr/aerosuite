package com.aerosuite.dto;

import java.util.List;

public class FcuAssemblyDoc {
    public String company;
    public String certificate;
    public String title;
    public String pn;
    public String sn;
    public String model;
    public String date;
    public String os;
    public String client;
    public String manual;
    public String revision;
    public String revisionDate;
    public String ata;
    public Integer pages;
    public String observations;
    public List<AssemblySection> sections;

    public static class AssemblySection {
        public String id;
        public String title;
        public List<AssemblyStep> steps;
    }

    public static class AssemblyStep {
        public String imageData; // base64
        public String imageType; // mime
        public String kind; // step | note | caution | warning
        public String code;
        public String title;
        public String text;
        public List<String> refs;
    }
}
