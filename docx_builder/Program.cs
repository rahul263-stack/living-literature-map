// Program.cs - Academic Literature Review Document
// Network Neuroscience and Brain Connectomics
// Clean academic styling with serif typography

using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace Docx;

public class Program
{
    // ====================================================================
    // Color Scheme — Academic Ink (cool slate / neutral)
    // ====================================================================
    private static class Colors
    {
        public const string Primary = "1a365d";       // Deep navy — headings
        public const string Dark = "1f2937";          // Near-black — body text
        public const string Mid = "4b5563";           // Medium gray — secondary text
        public const string Light = "6b7280";         // Light gray — captions
        public const string Accent = "7c3aed";        // Deep violet — accent
        public const string Border = "d1d5db";        // Table borders
        public const string TableHeader = "f3f4f6";   // Table header bg
    }

    private const int A4W = 11906;
    private const int A4H = 16838;

    public static void Main(string[] args)
    {
        string outputPath = args.Length > 0 ? args[0] : "/mnt/agents/output/literature_review.docx";
        Generate(outputPath);
    }

    public static void Generate(string outputPath)
    {
        using var doc = WordprocessingDocument.Create(outputPath, WordprocessingDocumentType.Document);
        var mainPart = doc.AddMainDocumentPart();
        mainPart.Document = new Document(new Body());
        var body = mainPart.Document.Body!;

        AddStyles(mainPart);

        uint prId = 1;
        AddCoverSection(body);
        AddTocSection(body);
        AddContentSection(body, mainPart, ref prId);

        SetUpdateFieldsOnOpen(mainPart);
        doc.Save();
    }

    // ====================================================================
    // Styles — Academic serif typography
    // ====================================================================
    private static void AddStyles(MainDocumentPart mainPart)
    {
        var sp = mainPart.AddNewPart<StyleDefinitionsPart>();
        sp.Styles = new Styles();

        // Normal — Cambria serif, 11pt, 1.5 line spacing
        sp.Styles.Append(new Style(
            new StyleName { Val = "Normal" },
            new StyleParagraphProperties(
                new SpacingBetweenLines { After = "200", Line = "360", LineRule = LineSpacingRuleValues.Auto },
                new Justification { Val = JustificationValues.Both }),
            new StyleRunProperties(
                new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria", EastAsia = "Times New Roman" },
                new FontSize { Val = "22" },
                new Color { Val = Colors.Dark })
        ) { Type = StyleValues.Paragraph, StyleId = "Normal", Default = true });

        // Heading 1 — Section level
        sp.Styles.Append(new Style(
            new StyleName { Val = "heading 1" }, new BasedOn { Val = "Normal" },
            new StyleParagraphProperties(
                new KeepNext(), new KeepLines(), new PageBreakBefore(),
                new SpacingBetweenLines { Before = "480", After = "240", Line = "276", LineRule = LineSpacingRuleValues.Auto },
                new OutlineLevel { Val = 0 }),
            new StyleRunProperties(
                new Bold(), new FontSize { Val = "36" },
                new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria", EastAsia = "Times New Roman" },
                new Color { Val = Colors.Primary })
        ) { Type = StyleValues.Paragraph, StyleId = "Heading1" });

        // Heading 2 — Subsection level
        sp.Styles.Append(new Style(
            new StyleName { Val = "heading 2" }, new BasedOn { Val = "Normal" },
            new StyleParagraphProperties(
                new KeepNext(), new KeepLines(),
                new SpacingBetweenLines { Before = "360", After = "160", Line = "276", LineRule = LineSpacingRuleValues.Auto },
                new OutlineLevel { Val = 1 }),
            new StyleRunProperties(
                new Bold(), new FontSize { Val = "28" },
                new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria", EastAsia = "Times New Roman" },
                new Color { Val = Colors.Dark })
        ) { Type = StyleValues.Paragraph, StyleId = "Heading2" });

        // Heading 3 — Sub-subsection level
        sp.Styles.Append(new Style(
            new StyleName { Val = "heading 3" }, new BasedOn { Val = "Normal" },
            new StyleParagraphProperties(
                new KeepNext(), new KeepLines(),
                new SpacingBetweenLines { Before = "280", After = "120" },
                new OutlineLevel { Val = 2 }),
            new StyleRunProperties(
                new Bold(), new Italic(), new FontSize { Val = "24" },
                new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria", EastAsia = "Times New Roman" },
                new Color { Val = Colors.Mid })
        ) { Type = StyleValues.Paragraph, StyleId = "Heading3" });

        // TOC styles
        sp.Styles.Append(CreateTocStyle("TOC1", "toc 1", true, "0", "200"));
        sp.Styles.Append(CreateTocStyle("TOC2", "toc 2", false, "360", "60"));
        sp.Styles.Append(CreateTocStyle("TOC3", "toc 3", false, "720", "40"));

        // Abstract style
        sp.Styles.Append(new Style(
            new StyleName { Val = "Abstract" }, new BasedOn { Val = "Normal" },
            new StyleParagraphProperties(
                new SpacingBetweenLines { Before = "200", After = "200" },
                new Indentation { Left = "720", Right = "720" }),
            new StyleRunProperties(new Italic(), new Color { Val = Colors.Mid })
        ) { Type = StyleValues.Paragraph, StyleId = "Abstract" });
    }

    private static Style CreateTocStyle(string id, string name, bool bold, string indent, string before)
    {
        var rpr = new StyleRunProperties(
            new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
            new Color { Val = bold ? Colors.Dark : Colors.Mid });
        if (bold) rpr.Append(new Bold());
        return new Style(
            new StyleName { Val = name }, new BasedOn { Val = "Normal" },
            new StyleParagraphProperties(
                new Tabs(new TabStop { Val = TabStopValues.Right, Leader = TabStopLeaderCharValues.Dot, Position = 9350 }),
                new SpacingBetweenLines { Before = before, After = "60" },
                new Indentation { Left = indent }),
            rpr
        ) { Type = StyleValues.Paragraph, StyleId = id };
    }

    // ====================================================================
    // Cover — Clean typography, no background image
    // ====================================================================
    private static void AddCoverSection(Body body)
    {
        // Top spacer
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { Before = "4000" }),
            new Run()));

        // Main title
        body.Append(new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { After = "200" }),
            new Run(new RunProperties(
                    new FontSize { Val = "72" },
                    new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
                    new Bold(),
                    new Color { Val = Colors.Primary }),
                new Text("Network Neuroscience and")),
            new Run(new RunProperties(
                    new FontSize { Val = "72" },
                    new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
                    new Bold(),
                    new Color { Val = Colors.Primary }),
                new Text(" Brain Connectomics"))));

        // Subtitle
        body.Append(new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { Before = "400", After = "600" }),
            new Run(new RunProperties(
                    new FontSize { Val = "40" },
                    new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
                    new Italic(),
                    new Color { Val = Colors.Mid }),
                new Text("A Literature Review"))));

        // Horizontal rule
        body.Append(new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Center },
                new ParagraphBorders(
                    new BottomBorder { Val = BorderValues.Single, Size = 8, Color = Colors.Primary, Space = 1 }),
                new Indentation { Left = "2880", Right = "2880" },
                new SpacingBetweenLines { After = "600" }),
            new Run()));

        // Description
        body.Append(new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { After = "200" }),
            new Run(new RunProperties(
                    new FontSize { Val = "24" },
                    new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
                    new Color { Val = Colors.Mid }),
                new Text("Mapping the intellectual landscape of 244 foundational papers"))));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { After = "200" }),
            new Run(new RunProperties(
                    new FontSize { Val = "24" },
                    new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
                    new Color { Val = Colors.Mid }),
                new Text("across nine research communities, 1994\u20132026"))));

        // Bottom spacer + metadata
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { Before = "3000" }),
            new Run()));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { After = "100" }),
            new Run(new RunProperties(
                    new FontSize { Val = "22" },
                    new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
                    new Color { Val = Colors.Light }),
                new Text("Keyword co-occurrence network analysis"))));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Center }),
            new Run(new RunProperties(
                    new FontSize { Val = "20" },
                    new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
                    new Color { Val = Colors.Light }),
                new Text("Network density: 71.5%  |  Modularity Q = 0.08  |  Average degree: 174.5"))));

        // Cover section break — no margins (title page)
        body.Append(new Paragraph(new ParagraphProperties(new SectionProperties(
            new TitlePage(),
            new SectionType { Val = SectionMarkValues.NextPage },
            new PageSize { Width = (UInt32Value)(uint)A4W, Height = (UInt32Value)(uint)A4H },
            new PageMargin { Top = 1440, Right = 1440, Bottom = 1440, Left = 1440, Header = 720, Footer = 720 }))));
    }

    // ====================================================================
    // TOC — Table of Contents
    // ====================================================================
    private static void AddTocSection(Body body)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { Before = "600", After = "400" }),
            new Run(new RunProperties(
                    new FontSize { Val = "36" },
                    new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
                    new Bold(),
                    new Color { Val = Colors.Primary }),
                new Text("Table of Contents"))));

        // TOC field
        body.Append(new Paragraph(
            new Run(new FieldChar { FieldCharType = FieldCharValues.Begin }),
            new Run(new FieldCode(" TOC \\o \"1-3\" \\h \\z \\u ") { Space = SpaceProcessingModeValues.Preserve }),
            new Run(new FieldChar { FieldCharType = FieldCharValues.Separate })));

        // Placeholder entries matching document structure
        string[,] toc = {
            { "Abstract", "1", "1" },
            { "1. Introduction", "1", "2" },
            { "2. Schools of Thought", "1", "3" },
            { "2.1 Foundations & Graph Theory", "2", "3" },
            { "2.2 Resting-State fMRI & Default Mode Network", "2", "4" },
            { "2.3 Structural Connectivity & dMRI", "2", "5" },
            { "2.4 Dynamic FC & Brain States", "2", "5" },
            { "2.5 Clinical Applications", "2", "6" },
            { "2.6 Hubs, Rich-Club & Gradients", "2", "6" },
            { "2.7 Precision Mapping & Individual Differences", "2", "7" },
            { "2.8 Methods, Tools & Parcellations", "2", "7" },
            { "2.9 Recent Advances (arXiv Preprints)", "2", "8" },
            { "3. Evolution of Debates", "1", "9" },
            { "3.1 Static vs. Dynamic Functional Connectivity", "2", "9" },
            { "3.2 Group vs. Individual Networks", "2", "10" },
            { "3.3 Null Model Controversy", "2", "10" },
            { "3.4 Structure-Function Coupling", "2", "11" },
            { "4. The Research Gap: Precision Structural Connectome Mapping", "1", "12" },
            { "4.1 Identifying the Gap", "2", "12" },
            { "4.2 Argument Spine", "2", "12" },
            { "4.3 Proposed Research Agenda", "2", "13" },
            { "5. Conclusion", "1", "14" },
            { "References", "1", "15" },
        };
        for (int i = 0; i < toc.GetLength(0); i++)
            body.Append(new Paragraph(
                new ParagraphProperties(new ParagraphStyleId { Val = $"TOC{toc[i, 1]}" }),
                new Run(new Text(toc[i, 0])), new Run(new TabChar()), new Run(new Text(toc[i, 2]))));

        body.Append(new Paragraph(new Run(new FieldChar { FieldCharType = FieldCharValues.End })));

        // TOC section break
        body.Append(new Paragraph(new ParagraphProperties(new SectionProperties(
            new SectionType { Val = SectionMarkValues.NextPage },
            new PageSize { Width = (UInt32Value)(uint)A4W, Height = (UInt32Value)(uint)A4H },
            new PageMargin { Top = 1440, Right = 1440, Bottom = 1440, Left = 1440, Header = 720, Footer = 720 }))));
    }

    // ====================================================================
    // Content — Header, Footer, and all body content
    // ====================================================================
    private static void AddContentSection(Body body, MainDocumentPart mainPart, ref uint prId)
    {
        // Header
        var headerPart = mainPart.AddNewPart<HeaderPart>();
        var headerId = mainPart.GetIdOfPart(headerPart);
        headerPart.Header = new Header(new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Right },
                new ParagraphBorders(
                    new BottomBorder { Val = BorderValues.Single, Size = 4, Color = Colors.Border, Space = 1 })),
            new Run(new RunProperties(
                    new FontSize { Val = "18" },
                    new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
                    new Italic(),
                    new Color { Val = Colors.Light }),
                new Text("Network Neuroscience and Brain Connectomics: A Literature Review"))));

        // Footer with page number
        var footerPart = mainPart.AddNewPart<FooterPart>();
        var footerId = mainPart.GetIdOfPart(footerPart);
        var fp = new Paragraph(new ParagraphProperties(new Justification { Val = JustificationValues.Center }));
        fp.Append(new Run(new RunProperties(
            new FontSize { Val = "20" },
            new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
            new Color { Val = Colors.Light }),
            new FieldChar { FieldCharType = FieldCharValues.Begin }));
        fp.Append(new Run(new RunProperties(
            new FontSize { Val = "20" },
            new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
            new Color { Val = Colors.Light }),
            new FieldCode(" PAGE ") { Space = SpaceProcessingModeValues.Preserve }));
        fp.Append(new Run(new RunProperties(
            new FontSize { Val = "20" },
            new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
            new Color { Val = Colors.Light }),
            new FieldChar { FieldCharType = FieldCharValues.Separate }));
        fp.Append(new Run(new RunProperties(
            new FontSize { Val = "20" },
            new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
            new Color { Val = Colors.Light }),
            new Text("1")));
        fp.Append(new Run(new RunProperties(
            new FontSize { Val = "20" },
            new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
            new Color { Val = Colors.Light }),
            new FieldChar { FieldCharType = FieldCharValues.End }));
        footerPart.Footer = new Footer(fp);

        // --- BODY CONTENT ---

        // Abstract
        body.Append(CreateHeading1("Abstract", "_Toc001"));
        body.Append(CreateAbstract("This review maps the intellectual landscape of network neuroscience \u2014 the application of graph theory and complex network analysis to the study of brain structure and function. Drawing on 244 highly-cited papers published between 1994 and 2026, we identify nine distinct schools of thought, trace the evolution of four major debates, and articulate a critical research gap at the intersection of structural connectomics and precision functional mapping. Our analysis reveals that while individual variability in functional connectivity has received substantial attention, structural connectivity analysis remains dominated by group-average approaches, limiting our understanding of how individual anatomical architecture shapes functional network organization. This review provides both a comprehensive overview of the field and a targeted research agenda for precision structural-functional connectomics."));

        // 1. Introduction
        body.Append(CreateHeading1("1. Introduction", "_Toc002"));
        body.Append(CreateParagraph("The human brain is among the most complex networks known to science, comprising approximately 86 billion neurons connected by trillions of synapses. Understanding the organizational principles of this network has been a central challenge in neuroscience for over a century. The advent of non-invasive neuroimaging techniques \u2014 particularly resting-state functional MRI (rs-fMRI) and diffusion MRI tractography \u2014 has enabled the mapping of large-scale brain networks in vivo, giving rise to the field of network neuroscience (also called brain connectomics)."));
        body.Append(CreateParagraph("This review provides a systematic mapping of the network neuroscience literature based on 244 foundational and influential papers. Unlike traditional narrative reviews, this analysis employs network-analytic methods to identify the field's intellectual communities, trace its conceptual evolution, and pinpoint critical gaps. The corpus spans from Tononi, Sporns, and Edelman's (1994) seminal work on brain complexity to cutting-edge preprints on graph neural networks and Koopman operators for brain dynamics."));

        // 2. Schools of Thought
        body.Append(CreateHeading1("2. Schools of Thought", "_Toc003"));
        body.Append(CreateParagraph("We identified nine distinct research communities through Louvain modularity optimization (Q = 0.08), reflecting the field's highly interdisciplinary nature. The low modularity indicates substantial cross-pollination between communities \u2014 a hallmark of a healthy, interconnected field."));

        // 2.1
        body.Append(CreateHeading2("2.1 Foundations & Graph Theory"));
        body.Append(CreateParagraph("The foundational community (47 papers, ~123,000 citations) established the theoretical framework for applying graph theory to neuroscience. Led by Olaf Sporns, Ed Bullmore, and Marcus Kaiser, this school introduced key concepts including small-world topology (Watts & Strogatz, 1998; Bassett & Bullmore, 2006), network efficiency (Latora & Marchiori, 2001), modularity (Newman, 2006), and the economy of brain network organization (Bullmore & Sporns, 2012)."));
        body.Append(CreateParagraph("Sporns' (2011) monograph Networks of the Brain and the comprehensive review by Bullmore and Sporns (2009) in Nature Reviews Neuroscience (14,842 citations) are the field's most-cited works. Rubinov and Sporns' (2010) NeuroImage paper on complex network measures (13,834 citations) provided the methodological toolkit that enabled subsequent research across all communities."));
        body.Append(CreateBoldParagraph("Key contribution:", " Established graph theory as the lingua franca of brain network analysis and identified small-world topology, cost-efficiency trade-offs, and hierarchical modularity as organizing principles of brain networks."));

        // 2.2
        body.Append(CreateHeading2("2.2 Resting-State fMRI & Default Mode Network"));
        body.Append(CreateParagraph("The second community (24 papers, ~42,000 citations) focused on mapping functional connectivity using resting-state fMRI. Marcus Raichle's discovery of the default mode network (DMN) \u2014 brain regions that deactivate during task performance but activate during rest \u2014 fundamentally changed our understanding of intrinsic brain organization (Raichle et al., 2001; 16,247 citations)."));
        body.Append(CreateParagraph("Key developments include: Biswal and colleagues' (1995) demonstration of spontaneous low-frequency BOLD signal correlations; Greicius and colleagues' (2003) network analysis of the DMN; and Power and colleagues' (2011) influential graph-based parcellation of the cerebral cortex. This school also generated important methodological contributions, including Power and colleagues' (2012, 1,790 citations) critical paper on motion artifacts in functional connectivity MRI."));
        body.Append(CreateBoldParagraph("Key contribution:", " Demonstrated that the brain exhibits organized functional architectures even in the absence of explicit tasks, and identified the DMN as a core organizational hub."));

        // 2.3
        body.Append(CreateHeading2("2.3 Structural Connectivity & dMRI"));
        body.Append(CreateParagraph("The structural connectivity community (23 papers, ~15,000 citations) used diffusion MRI tractography to map white matter pathways. Patric Hagmann's (2005, 2008) pioneering work introduced the term \"connectome\" and demonstrated its small-world properties. Key contributions include Behrens and colleagues' probabilistic tractography methods, Jeurissen and colleagues' (2019) review of diffusion MRI fiber tractography, and the Human Connectome Project's (Van Essen et al., 2013) multimodal structural mapping pipelines."));
        body.Append(CreateBoldParagraph("Key contribution:", " Provided the anatomical substrate for functional network organization and established that structural connectivity constrains but does not fully determine functional connectivity."));

        // 2.4
        body.Append(CreateHeading2("2.4 Dynamic FC & Brain States"));
        body.Append(CreateParagraph("The dynamic functional connectivity community (25 papers, ~11,000 citations) challenged the assumption that resting-state connectivity is static. Hutchison and colleagues' (2013) \"chronnectome\" framework and Allen and colleagues' (2014, 3,494 citations) sliding-window analysis demonstrated that functional connectivity exhibits rich temporal dynamics. Calhoun and colleagues' work on time-varying connectivity and dynamic state modeling has been particularly influential."));
        body.Append(CreateBoldParagraph("Key contribution:", " Established that brain networks are not static entities but undergo continuous reconfiguration, and developed methods to characterize these dynamic patterns."));

        // 2.5
        body.Append(CreateHeading2("2.5 Clinical Applications"));
        body.Append(CreateParagraph("The clinical community (25 papers, ~20,000 citations) applies connectomic methods to neurological and psychiatric disorders. Crossley and colleagues' (2014, 2,101 citations) Nature Reviews Neuroscience review synthesized evidence for network dysfunction across disorders. Key developments include DMN disruption in Alzheimer's disease (Greicius et al., 2004), dysconnectivity in schizophrenia (Friston, 1998; Fornito et al., 2015), and connectome-wide association studies (CWAS) for biomarker discovery."));
        body.Append(CreateBoldParagraph("Key contribution:", " Demonstrated that brain disorders can be understood as disorders of network connectivity, opening avenues for connectome-based biomarkers."));

        // 2.6
        body.Append(CreateHeading2("2.6 Hubs, Rich-Club & Gradients"));
        body.Append(CreateParagraph("This community (25 papers, ~23,000 citations) investigates the architectural principles of brain network organization. Van den Heuvel and Sporns' (2011, 2,823 citations) rich-club analysis demonstrated that high-degree network hubs are densely interconnected, forming a \"rich club\" that facilitates global communication. Margulies and colleagues' (2016, 2,566 citations) connectivity gradients paper revealed a principal axis of cortical organization from unimodal to transmodal regions."));
        body.Append(CreateBoldParagraph("Key contribution:", " Identified hierarchical organization principles (rich-club, core-periphery, gradients) that explain how brain networks balance segregation and integration."));

        // 2.7
        body.Append(CreateHeading2("2.7 Precision Mapping & Individual Differences"));
        body.Append(CreateParagraph("The precision mapping community (25 papers, ~9,000 citations) focuses on individual variability in brain network organization. Finn and colleagues' (2015, 3,318 citations) connectome fingerprinting paper demonstrated that individual connectivity patterns are sufficiently unique to identify individuals \u2014 the field's most-cited empirical study. Gordon and colleagues' (2017, 1,543 citations) precision functional mapping showed that individual-specific areal-level parcellations improve behavior prediction over group atlases."));
        body.Append(CreateBoldParagraph("Key contribution:", " Established that group-average connectomes obscure behaviorally meaningful individual differences and developed methods for personalized brain mapping."));

        // 2.8
        body.Append(CreateHeading2("2.8 Methods, Tools & Parcellations"));
        body.Append(CreateParagraph("The methods community (25 papers, ~15,000 citations) develops analytical pipelines, software tools, and parcellation schemes. Key contributions include: Schaefer and colleagues' (2018, 4,444 citations) local-global parcellation; fMRIPrep (Esteban et al., 2019, 4,675 citations) for robust preprocessing; MRtrix (Tournier et al., 2019, 1,845 citations) for diffusion analysis; and quality control frameworks (Ciric et al., 2017; Power et al., 2012)."));
        body.Append(CreateBoldParagraph("Key contribution:", " Transformed network neuroscience from a specialized methodology to an accessible, standardized toolkit."));

        // 2.9
        body.Append(CreateHeading2("2.9 Recent Advances (arXiv Preprints)"));
        body.Append(CreateParagraph("The most recent community comprises 25 preprints (2022\u20132026) applying advanced computational methods to connectomics, including graph neural networks (GNNs), Koopman operators for brain dynamics, spectral graph theory, and topological data analysis. While not yet peer-reviewed, these works signal the field's trajectory toward deep learning and dynamical systems approaches."));

        // 3. Evolution of Debates
        body.Append(CreateHeading1("3. Evolution of Debates", "_Toc004"));

        // 3.1
        body.Append(CreateHeading2("3.1 Static vs. Dynamic Functional Connectivity"));
        body.Append(CreateParagraph("The field's most persistent debate concerns whether resting-state functional connectivity is fundamentally static or dynamic. Early rs-fMRI studies (Biswal et al., 1995; Lowe et al., 1998) assumed stability, computing single correlation matrices across entire scanning sessions. However, by 2013, Hutchison and colleagues' chronnectome framework and Allen and colleagues' sliding-window analysis demonstrated substantial temporal variability."));
        body.Append(CreateParagraph("Current status: ONGOING. While the existence of temporal dynamics is now accepted, debate continues regarding: (a) the appropriate timescales for dynamic FC analysis; (b) whether observed dynamics reflect neural processes or artifacts (motion, sampling variability); and (c) the behavioral relevance of dynamic states. The sliding window technique itself has been criticized (Lurie et al., 2020), spurring development of alternative methods including phase synchrony, hidden Markov models, and point-process analysis."));

        // 3.2
        body.Append(CreateHeading2("3.2 Group vs. Individual Networks"));
        body.Append(CreateParagraph("The tension between group-representative and individual-specific approaches intensified after 2015. Traditional parcellations (Desikan-Killiany, Glasser, Schaefer) are derived from group averages, potentially missing individual network topology. Finn and colleagues' (2015) fingerprinting study and Gordon and colleagues' (2017) precision mapping provided compelling evidence for individual variability."));
        body.Append(CreateParagraph("Current status: EMERGING CONSENSUS toward individual approaches. While group atlases remain standard due to their convenience and reliability, there is growing recognition that precision mapping enhances behavioral prediction. Key challenges include: reliability of single-subject parcellations, computational cost, and the need for longer scanning sessions."));

        // 3.3
        body.Append(CreateHeading2("3.3 Null Model Controversy"));
        body.Append(CreateParagraph("Appropriate null models for brain networks have been debated since network neuroscience's inception. The field initially adopted random graphs (Erdos-Renyi) and lattice nulls, but these fail to preserve key network properties (degree distribution, clustering). Subsequent work developed configuration models, exponential random graph models, and geometric nulls. Vasa and Misic's (2022) comprehensive review highlighted that different null models can lead to opposite conclusions about network properties."));
        body.Append(CreateParagraph("Current status: ONGOING. No consensus null model exists. The choice of null model remains a critical methodological decision that can fundamentally alter conclusions about network topology."));

        // 3.4
        body.Append(CreateHeading2("3.4 Structure-Function Coupling"));
        body.Append(CreateParagraph("The relationship between anatomical connectivity (white matter tracts) and functional connectivity (BOLD correlations) has been debated since Honey and colleagues' (2009) seminal study. While structural connectivity generally predicts functional connectivity strength, the relationship is moderate (r ~ 0.4-0.6) and varies across brain regions."));
        body.Append(CreateParagraph("Current status: SETTLED in broad outline, ACTIVE in details. Structure constrains function but does not fully determine it. Key open questions include: regional variation in coupling strength; changes in coupling across development, aging, and disease; and the role of indirect polysynaptic connections."));

        // 4. The Research Gap
        body.Append(CreateHeading1("4. The Research Gap: Precision Structural Connectome Mapping", "_Toc005"));

        // 4.1
        body.Append(CreateHeading2("4.1 Identifying the Gap"));
        body.Append(CreateParagraph("Our network analysis revealed a structural hole between the Structural Connectivity & dMRI community and the Precision Mapping & Individual Differences community. Cross-community edge strength (3.845) is 14.6% below the mean inter-community connectivity (4.5), indicating surprisingly limited intellectual exchange between these adjacent fields."));
        body.Append(CreateParagraph("Despite extensive research on individual variability in functional connectivity, structural connectivity analysis remains dominated by group-average approaches. No standardized methodology exists for precision structural connectome mapping \u2014 the anatomical counterpart to precision functional mapping."));

        // 4.2
        body.Append(CreateHeading2("4.2 Argument Spine"));
        body.Append(CreateParagraph("Claim: Individual differences in brain network organization are primarily studied through functional connectivity, while structural connectivity remains analyzed at the group level, creating a methodological asymmetry that limits our understanding of how anatomy shapes individual functional topology."));
        body.Append(CreateParagraph("Evidence: Finn and colleagues (2015, 3,318 citations) demonstrated functional connectome fingerprinting; Gordon and colleagues (2017, 1,543 citations) showed individual-specific parcellations improve behavior prediction; Kong and colleagues (2019, 724 citations) found individual-specific cortical network topography predicts cognition and personality. Yet structural connectomics studies \u2014 even highly-cited ones like Hagmann and colleagues (2008, 5,336 citations) \u2014 almost universally employ group-averaged tractography."));
        body.Append(CreateParagraph("Counter-evidence: Structural connectivity shows lower test-retest reliability than functional connectivity (Buchanan et al., 2014), raising questions about whether individual structural differences are reliable or noise. Diffusion MRI tractography has known limitations in crossing fiber regions (Jeurissen et al., 2019), and some argue that individual variability in structural connectivity reflects measurement error rather than true biological variation (Miranda-Dominguez et al., 2014)."));
        body.Append(CreateParagraph("The Gap: No standardized precision structural connectome methodology exists; structure-function coupling as an individual difference metric remains underdeveloped; most multimodal studies average across subjects, masking individual structure-function relationships."));
        body.Append(CreateParagraph("Why It Matters: Individual variability in brain structure is the anatomical scaffold for functional variability. Without precision structural mapping, we cannot determine whether observed functional differences reflect true neural variation or noise. This limitation affects: (a) clinical translation \u2014 patient-specific interventions require both structural and functional biomarkers; (b) developmental research \u2014 structure-function coupling changes substantially across the lifespan; and (c) the fundamental question of how anatomical architecture constrains functional dynamics."));

        // 4.3
        body.Append(CreateHeading2("4.3 Proposed Research Agenda"));
        body.Append(CreateParagraph("To address this gap, we propose three lines of inquiry:"));
        body.Append(CreateNumberedParagraph("1.", " Develop precision structural connectome mapping pipelines that account for individual variability in white matter architecture, using within-subject test-retest designs to establish reliability thresholds."));
        body.Append(CreateNumberedParagraph("2.", " Validate structure-function coupling as a behaviorally-reliable individual difference metric, benchmarking against functional-only precision mapping using the same behavioral prediction paradigms."));
        body.Append(CreateNumberedParagraph("3.", " Investigate the clinical utility of precision structural-functional measures in patient populations where individual network reorganization may be clinically informative (e.g., pre-surgical planning, stroke recovery, neurodegeneration)."));

        // 5. Conclusion
        body.Append(CreateHeading1("5. Conclusion", "_Toc006"));
        body.Append(CreateParagraph("Network neuroscience has matured from a niche methodology into a flourishing interdisciplinary field with nine distinct but interconnected research communities. The field's debates \u2014 static vs. dynamic connectivity, group vs. individual networks, null model selection, and structure-function coupling \u2014 reflect healthy scientific discourse rather than fundamental disagreements."));
        body.Append(CreateParagraph("Our analysis identified precision structural connectome mapping as a critical research gap. While functional connectomics has embraced individual variability, structural connectomics remains anchored to group-average approaches. Closing this gap will require methodological innovation, validation studies, and \u2014 most importantly \u2014 greater cross-pollination between the structural connectivity and precision mapping communities."));
        body.Append(CreateParagraph("The field's trajectory is clear: toward increasingly individualized, multimodal, and dynamically-informed models of brain network organization. Realizing this vision will require not only technical advances but also continued attention to the methodological rigor, open science practices, and interdisciplinary collaboration that have characterized network neuroscience's first three decades."));

        // References
        body.Append(CreateHeading1("References", "_Toc007"));
        body.Append(CreateParagraph("The full bibliography of 244 papers is available in the companion corpus (bibliography.bib / bibliography.csv). Key references cited in this review include:"));
        body.Append(CreateReference("Allen, E.A., et al. (2014). Tracking whole-brain connectivity dynamics in the resting state. Cerebral Cortex, 24(3), 663\u2013676. https://doi.org/10.1093/cercor/bhs352"));
        body.Append(CreateReference("Bassett, D.S., & Bullmore, E.T. (2006). Small-world brain networks. The Neuroscientist, 12(6), 512\u2013523."));
        body.Append(CreateReference("Bullmore, E.T., & Sporns, O. (2009). Complex brain networks: graph theoretical analysis of structural and functional systems. Nature Reviews Neuroscience, 10(3), 186\u2013198."));
        body.Append(CreateReference("Bullmore, E.T., & Sporns, O. (2012). The economy of brain network organization. Nature Reviews Neuroscience, 13(5), 336\u2013349."));
        body.Append(CreateReference("Finn, E.S., et al. (2015). Functional connectome fingerprinting: identifying individuals using patterns of brain connectivity. Nature Neuroscience, 18(11), 1664\u20131671."));
        body.Append(CreateReference("Gordon, E.M., et al. (2017). Precision functional mapping of individual human brains. Neuron, 95(4), 791\u2013807."));
        body.Append(CreateReference("Greicius, M.D., et al. (2003). Functional connectivity in the resting brain: A network analysis of the default mode hypothesis. PNAS, 100(1), 253\u2013258."));
        body.Append(CreateReference("Hagmann, P., et al. (2008). Mapping the structural core of human cerebral cortex. PLoS Biology, 6(7), e159."));
        body.Append(CreateReference("Hutchison, R.M., et al. (2013). Dynamic functional connectivity: Promise, issues, and interpretations. NeuroImage, 80, 360\u2013378."));
        body.Append(CreateReference("Margulies, D.S., et al. (2016). Situating the default-mode network along a principal gradient of macroscale cortical organization. PNAS, 113(44), 12574\u201312579."));
        body.Append(CreateReference("Power, J.D., et al. (2011). Functional network organization of the human brain. Neuron, 72(4), 665\u2013678."));
        body.Append(CreateReference("Raichle, M.E., et al. (2001). A default mode of brain function. PNAS, 98(2), 676\u2013682."));
        body.Append(CreateReference("Rubinov, M., & Sporns, O. (2010). Complex network measures of brain connectivity: uses and interpretations. NeuroImage, 52(3), 1059\u20131069."));
        body.Append(CreateReference("Sporns, O. (2011). The human connectome: a complex network. Annals of the New York Academy of Sciences, 1224(1), 109\u2013125."));
        body.Append(CreateReference("Sporns, O. (2011). Networks of the Brain. MIT Press."));
        body.Append(CreateReference("Tononi, G., Sporns, O., & Edelman, G.M. (1994). A measure for brain complexity: relating functional segregation and integration in the nervous system. PNAS, 91(11), 5033\u20135037."));
        body.Append(CreateReference("Van den Heuvel, M.P., & Sporns, O. (2011). Rich-club organization of the human connectome. Journal of Neuroscience, 31(44), 15775\u201315786."));
        body.Append(CreateReference("Van Essen, D.C., et al. (2013). The WU-Minn Human Connectome Project: an overview. NeuroImage, 80, 62\u201379."));

        // Footer note
        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "600" },
                new ParagraphBorders(
                    new TopBorder { Val = BorderValues.Single, Size = 4, Color = Colors.Border, Space = 8 }),
                new Justification { Val = JustificationValues.Center }),
            new Run(new RunProperties(
                    new Italic(),
                    new FontSize { Val = "18" },
                    new RunFonts { Ascii = "Cambria", HighAnsi = "Cambria" },
                    new Color { Val = Colors.Light }),
                new Text("Review compiled from 244 papers. Data mode: keyword co-occurrence network. Modularity Q = 0.08. Network density: 71.5%. Average degree: 174.5. Year range: 1994\u20132026."))));

        // Final section properties with header and footer
        body.Append(new SectionProperties(
            new HeaderReference { Type = HeaderFooterValues.Default, Id = headerId },
            new FooterReference { Type = HeaderFooterValues.Default, Id = footerId },
            new PageSize { Width = (UInt32Value)(uint)A4W, Height = (UInt32Value)(uint)A4H },
            new PageMargin { Top = 1440, Right = 1440, Bottom = 1440, Left = 1440, Header = 720, Footer = 720 }));
    }

    // ====================================================================
    // Factory helpers — each call creates NEW elements
    // ====================================================================

    private static int _bookmarkId = 100;

    private static Paragraph CreateHeading1(string text, string bookmarkName)
    {
        int id = ++_bookmarkId;
        return new Paragraph(
            new ParagraphProperties(new ParagraphStyleId { Val = "Heading1" }),
            new BookmarkStart { Id = id.ToString(), Name = bookmarkName },
            new Run(new Text(text)),
            new BookmarkEnd { Id = id.ToString() });
    }

    private static Paragraph CreateHeading2(string text)
    {
        return new Paragraph(
            new ParagraphProperties(new ParagraphStyleId { Val = "Heading2" }),
            new Run(new Text(text)));
    }

    private static Paragraph CreateParagraph(string text)
    {
        return new Paragraph(new Run(new Text(text)));
    }

    private static Paragraph CreateAbstract(string text)
    {
        return new Paragraph(
            new ParagraphProperties(new ParagraphStyleId { Val = "Abstract" }),
            new Run(new Text(text)));
    }

    private static Paragraph CreateBoldParagraph(string boldText, string normalText)
    {
        return new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { Before = "120", After = "200" }),
            new Run(new RunProperties(new Bold(), new Color { Val = Colors.Dark }), new Text(boldText)),
            new Run(new Text(normalText) { Space = SpaceProcessingModeValues.Preserve }));
    }

    private static Paragraph CreateNumberedParagraph(string number, string text)
    {
        return new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "80", After = "80" },
                new Indentation { Left = "720", Hanging = "360" }),
            new Run(new RunProperties(new Bold()), new Text(number) { Space = SpaceProcessingModeValues.Preserve }),
            new Run(new Text(text) { Space = SpaceProcessingModeValues.Preserve }));
    }

    private static Paragraph CreateReference(string text)
    {
        return new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { After = "80" },
                new Indentation { Left = "720", Hanging = "720" }),
            new Run(new RunProperties(new Color { Val = Colors.Mid }), new Text(text)));
    }

    private static void SetUpdateFieldsOnOpen(MainDocumentPart mp)
    {
        var sp = mp.DocumentSettingsPart ?? mp.AddNewPart<DocumentSettingsPart>();
        sp.Settings = new Settings(new UpdateFieldsOnOpen { Val = true });
    }
}
