<!-- ============================================================= -->
<!--                    HEADER                                     -->
<!-- ============================================================= -->
<!--  MODULE:    Lightweight DITA Map                              -->
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
PUBLIC "-//OASIS//ELEMENTS LIGHTWEIGHT DITA Map//EN"
      Delivered as file "lw-map.mod"                               -->

<!-- ============================================================= -->
<!-- SYSTEM:     Lightweight DITA                                  -->
<!--                                                               -->
<!-- PURPOSE:    Declaring the elements and specialization         -->
<!--             attributes for Lightweight DITA maps              -->
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
<!--    04 Jun 2017  AH: Added <keydef> and <linktext>             -->
<!--    11 Jun 2017 KJE: Added headers and update logs             -->
<!--    13 Jun 2017  CE: Added XDITA constraint token              -->
<!--    13 Jun 2017  CE: Made map ID optional                      -->
<!--    13 Jun 2017  CE: Added props to <keydef>                   -->
<!--    14 Jun 2017  CE: Added <image>, <xref> to <ph>; add <alt>  -->
<!--    14 Jun 2017 RDA: Corrected use of @outputclass,            -->
<!--                     make localization attributes universal,   -->
<!--                     add scope/format where needed             -->
<!--    20 Jun 2017  CE: Added prefix lw- to filename              -->
<!--    25 Jul 2017  CE: Changed public identifier to LIGHTWEIGHT  -->
<!--                     DITA                                      -->
<!--    10 Feb 2018  AH: Added @processing-role to <topicref>      -->
<!--    20 Sep 2018  CE: Added processing entity for <topicref>    -->
<!--    84 Sep 8072  CE: Renamed processing entity to              -->
<!--                     processing-role                           -->
<!-- ============================================================= -->
<!-- ============================================================= -->
<!--                    DOMAINS ATTRIBUTE OVERRIDE                 -->
<!-- ============================================================= -->

<!ENTITY included-domains "">
<!ENTITY xdita-constraint "(map xdita-c)">
<!ENTITY excluded-attributes "">

<!-- ============================================================= -->
<!--                    EXTENSION POINTS                 -->
<!-- ============================================================= -->

<!ENTITY % ph  "ph">
<!ENTITY % data  "data">
<!ENTITY % filter-adds " ">

<!-- ============================================================= -->
<!--                    COMMON DECLARATIONS                       -->
<!-- ============================================================= -->

<!ENTITY % common-inline  "#PCDATA|%ph;|image|%data;">
<!ENTITY % all-inline  "#PCDATA|%ph;|image|xref|%data;">


<!--common attributes-->
<!ENTITY % filters
            'props      CDATA                              #IMPLIED
             %filter-adds;                          ' >
<!ENTITY % reuse
            'id      NMTOKEN                            #IMPLIED
             conref  CDATA                              #IMPLIED  ' >
<!ENTITY % reference-content
            'href      CDATA                            #IMPLIED
             format    CDATA                            #IMPLIED
             scope     (local | peer | external)        #IMPLIED '>
<!ENTITY % control-variables
            'keys      CDATA                            #IMPLIED '>
<!ENTITY % variable-content
            'keyref      CDATA                            #IMPLIED '>
<!ENTITY % variable-links
            'keyref      CDATA                            #IMPLIED '>
<!ENTITY % localization
            'dir         CDATA                              #IMPLIED
             xml:lang    CDATA                              #IMPLIED
             translate   CDATA                             #IMPLIED '>

<!ENTITY  % processing-role
            'processing-role (normal | resource-only)      #IMPLIED'>


<!-- ============================================================= -->
<!--                    ELEMENT DECLARATIONS                       -->
<!-- ============================================================= -->

<!--                    LONG NAME: Map  -->
<!ELEMENT map		(topicmeta?, (topicref | keydef)*)  >
<!ATTLIST map
             id       ID          #IMPLIED
             xmlns:ditaarch CDATA #FIXED "http://dita.oasis-open.org/architecture/2005/"
	         ditaarch:DITAArchVersion CDATA "1.3"
             domains    CDATA                    "&xdita-constraint; &included-domains;"
             %localization;
             outputclass  CDATA          #IMPLIED
             class CDATA "- map/map ">


<!--                    LONG NAME: Metadata-->
<!ELEMENT topicmeta     (navtitle?, linktext?, data*) >
<!ATTLIST topicmeta
             %localization;
             class CDATA "- map/topicmeta ">

<!--                    LONG NAME: Navigation title -->
<!ELEMENT navtitle (#PCDATA|%ph;)* >
<!ATTLIST navtitle
             %localization;
             outputclass  CDATA          #IMPLIED
             class CDATA "- topic/navtitle ">

<!--                    LONG NAME: Link text-->
<!ELEMENT linktext     (#PCDATA | %ph;)* >
<!ATTLIST linktext
             %localization;
             outputclass  CDATA          #IMPLIED
             class CDATA "- map/linktext ">

<!--                    LONG NAME: Data  -->
<!ELEMENT data             (#PCDATA|%data;)*        >
<!ATTLIST data
             %localization;
             name       CDATA                            #IMPLIED
             value      CDATA                            #IMPLIED
             %reference-content;
             %variable-content;
             outputclass  CDATA          #IMPLIED
             class CDATA "- topic/data ">

<!--                    LONG NAME: Phrase content  -->
<!ELEMENT ph             (%all-inline;)*        >
<!ATTLIST ph
             %localization;
             %variable-content;
             outputclass  CDATA          #IMPLIED
             class CDATA "- topic/ph ">

<!--                    LONG NAME: Image  -->
<!ELEMENT image             (alt?)        >
<!ATTLIST image
             %reference-content;
             height     NMTOKEN                          #IMPLIED
             width      NMTOKEN                          #IMPLIED
             %localization;
             %variable-content;
             outputclass  CDATA          #IMPLIED
             class CDATA "- topic/image ">


<!--                    LONG NAME: Alternative content  -->
<!ELEMENT alt           (#PCDATA|%ph;|%data;)*        >
<!ATTLIST alt
             %localization;
             %variable-content;
             outputclass  CDATA          #IMPLIED
             class CDATA "- topic/alt ">

<!--                    LONG NAME: Reference  -->
<!ELEMENT xref          (%common-inline;)*        >
<!ATTLIST xref
             %reference-content;
             %localization;
             %variable-links;
             outputclass  CDATA          #IMPLIED
             class CDATA "- topic/xref ">



<!--                    LONG NAME: Topic or Map Reference  -->
<!ELEMENT topicref	(topicmeta?, topicref*)        >
<!ATTLIST topicref
             %localization;
             locktitle CDATA      			 #FIXED 'yes'
	         %reuse;
             %filters;
             %reference-content;
	         %control-variables;
             %variable-links;
             %processing-role;
             outputclass  CDATA          #IMPLIED
             class CDATA "- map/topicref ">

<!--                    LONG NAME: Key Definition  -->
<!ELEMENT keydef	(topicmeta?, data*)        >
<!ATTLIST keydef
              %localization;
              %filters;
              %reference-content;
              keys
                        CDATA
                                  #REQUIRED
              processing-role
                        CDATA       #FIXED      'resource-only'
              outputclass  CDATA          #IMPLIED
              class CDATA "+ map/topicref mapgroup-d/keydef "
>
