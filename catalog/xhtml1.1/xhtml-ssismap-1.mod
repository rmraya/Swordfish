<!-- ...................................................................... -->
<!-- XHTML Server-side Image Map Module  .................................. -->
<!-- file: xhtml-ssismap-1.mod

     This is XHTML, a reformulation of HTML as a modular XML application.
     Copyright 1998-2005 W3C (MIT, ERCIM, Keio), All Rights Reserved.
     Revision: $Id: xhtml-ssismap-1.mod,v 1.1 2018/03/20 04:25:06 plehegar Exp $ SMI

     This DTD module is identified by the PUBLIC and SYSTEM identifiers:

       PUBLIC "-//W3C//ELEMENTS XHTML Server-side Image Maps 1.0//EN"
       SYSTEM "http://www.w3.org/MarkUp/DTD/xhtml-ssismap-1.mod"

     Revisions:
#2000-10-22: added declaration for 'ismap' on <input>
     ....................................................................... -->

<!-- Server-side Image Maps

     This adds the 'ismap' attribute to the img and input elements
     to support server-side processing of a user selection.
-->

<!ATTLIST %img.qname;
      ismap        ( ismap )                #IMPLIED
>

<!ATTLIST %input.qname;
      ismap        ( ismap )                #IMPLIED
>

<!-- end of xhtml-ssismap-1.mod -->
