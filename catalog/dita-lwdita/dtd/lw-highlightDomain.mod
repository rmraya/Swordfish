<!-- ============================================================= -->
<!--                    HEADER                                     -->
<!-- ============================================================= -->
<!--  MODULE:    Lightweight DITA Highlighting Domain              -->
<!--  VERSION:   1.0                                               -->
<!--  DATE:      XXX                                               -->
<!--                                                               -->
<!-- ============================================================= -->

<!-- ============================================================= -->
<!--                    PUBLIC DOCUMENT TYPE DEFINITION            -->
<!--                    TYPICAL INVOCATION                         -->
<!--                                                               -->
<!--  Refer to this file by the following public identifier or an
      appropriate system identifier:
PUBLIC "-//OASIS//ELEMENTS LIGHTWEIGHT DITA Highlight Domain//EN"
      Delivered as file "lw-highlightDomain.mod"                      -->

<!-- ============================================================= -->
<!-- SYSTEM:     Lightweight DITA                                  -->
<!--                                                               -->
<!-- PURPOSE:    Declaring the elements and specialization         -->
<!--             attributes for the LwDITA highlighting domain     -->
<!--                                                               -->
<!-- ORIGINAL CREATION DATE:                                       -->
<!--             XXXX                                              -->
<!--                                                               -->
<!--             (C) OASIS                                         -->
<!--             All Rights Reserved.                              -->
<!--                                                               -->
<!--  UPDATES:                                                     -->
<!--    25 Nov 2014 KJE: Upload files to DITA TC SVN repo          -->
<!--    16 May 2016  MG: Upload files to GitHub repo               -->
<!--    11 Jun 2017 KJE: Added headers and update logs             -->
<!--    14 Jun 2017 RDA: Added @outputclass                        -->
<!--    25 Jul 2017  CE: Changed public identifier to LIGHTWEIGHT  -->
<!--                     DITA                                      -->
<!--     1 Mar 2018  CE: Renamed file to lw-highlightDomain.mod    -->
<!-- ============================================================= -->

<!--                    LONG NAME: Bold content  -->
<!ELEMENT b             (%all-inline;)*        >
<!ATTLIST b
             %localization;
             %variable-content;
             outputclass  CDATA          #IMPLIED
             class CDATA "+ topic/ph hi-d/b ">

<!--                    LONG NAME: Italic content  -->
<!ELEMENT i             (%all-inline;)*        >
<!ATTLIST i
             %localization;
             %variable-content;
             outputclass  CDATA          #IMPLIED
             class CDATA "+ topic/ph hi-d/i ">

<!--                    LONG NAME: Underlined content  -->
<!ELEMENT u             (%all-inline;)*        >
<!ATTLIST u
             %localization;
             %variable-content;
             outputclass  CDATA          #IMPLIED
             class CDATA "+ topic/ph hi-d/u ">

<!--                    LONG NAME: Superscript content  -->
<!ELEMENT sup             (%all-inline;)*        >
<!ATTLIST sup
             %localization;
             %variable-content;
             outputclass  CDATA          #IMPLIED
             class CDATA "+ topic/ph hi-d/sup ">

<!--                    LONG NAME: Subscript content  -->
<!ELEMENT sub             (%all-inline;)*        >
<!ATTLIST sub
             %localization;
             %variable-content;
             outputclass  CDATA          #IMPLIED
             class CDATA "+ topic/ph hi-d/sub ">
