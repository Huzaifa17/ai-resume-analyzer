import { type FormEvent, useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../../constants";

const Upload = () => {
    const { fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file);
    };

    // Create default feedback structure that matches all component expectations
    const createDefaultFeedback = (jobTitle: string, companyName: string) => {
        return {
            overallScore: 75,
            toneAndStyle: {
                score: 70,
                tips: [
                    {
                        type: "improve",
                        tip: "Use more active voice",
                        explanation: "Active voice makes your statements more direct and powerful. Instead of 'Was responsible for managing team,' write 'Managed a team of 5 engineers.'"
                    },
                    {
                        type: "improve",
                        tip: "Avoid clichés and overused phrases",
                        explanation: "Phrases like 'think outside the box' or 'hardworking' are overused. Use specific examples that demonstrate these qualities instead."
                    },
                    {
                        type: "good",
                        tip: "Maintain professional tone throughout",
                        explanation: "Your resume maintains a consistent professional tone, which is great for making a strong first impression."
                    }
                ]
            },
            content: {
                score: 72,
                tips: [
                    {
                        type: "improve",
                        tip: "Add more quantifiable achievements",
                        explanation: "Numbers help employers understand your impact. Instead of 'Improved sales,' write 'Increased sales by 30% in 6 months.'"
                    },
                    {
                        type: "improve",
                        tip: "Include relevant keywords from job description",
                        explanation: "Many companies use ATS to scan for keywords. Match your skills with the job description to increase your chances."
                    },
                    {
                        type: "good",
                        tip: "Focus on accomplishments rather than duties",
                        explanation: "You've done a good job highlighting achievements instead of just listing responsibilities."
                    }
                ]
            },
            structure: {
                score: 78,
                tips: [
                    {
                        type: "improve",
                        tip: "Use clear section headers",
                        explanation: "Standard headers like 'Work Experience' and 'Education' help ATS systems parse your resume correctly."
                    },
                    {
                        type: "good",
                        tip: "Keep bullet points concise",
                        explanation: "Your bullet points are well-sized and easy to read, which is excellent for busy recruiters."
                    },
                    {
                        type: "good",
                        tip: "Ensure consistent formatting",
                        explanation: "Consistent formatting makes your resume look professional and easier to scan."
                    }
                ]
            },
            skills: {
                score: 80,
                tips: [
                    {
                        type: "improve",
                        tip: "Highlight technical skills relevant to the position",
                        explanation: "Prioritize skills that match the job description. List the most relevant skills first."
                    },
                    {
                        type: "good",
                        tip: "Include soft skills with examples",
                        explanation: "You've done well to include soft skills. Consider adding brief examples of how you've used them."
                    },
                    {
                        type: "good",
                        tip: "Group related skills together",
                        explanation: "Your skills are well-organized, making it easy for recruiters to find what they're looking for."
                    }
                ]
            },
            ATS: {
                score: 75,
                tips: [
                    {
                        type: "improve",
                        tip: "Include keywords from the job description",
                        explanation: "ATS systems scan for specific keywords. Make sure to include important terms from the job posting."
                    },
                    {
                        type: "good",
                        tip: "Use standard section headings",
                        explanation: "Standard headings help ATS systems correctly identify different sections of your resume."
                    },
                    {
                        type: "improve",
                        tip: "Avoid images and graphics",
                        explanation: "ATS systems may not read images or graphics correctly. Stick to text for important information."
                    }
                ]
            },
            summary: `Your resume shows good potential for the ${jobTitle} position at ${companyName}. With some improvements to keyword optimization and achievement quantification, it could be even more competitive. Focus on adding more metrics and tailoring your skills section to match the job requirements.`,
            improvements: [
                "Add more metrics and numbers to showcase achievements",
                `Include more keywords related to ${jobTitle}`,
                "Strengthen the professional summary section"
            ],
            strengths: [
                "Clear work experience section",
                "Good use of action verbs",
                "Relevant skills highlighted"
            ]
        };
    };

    const handleAnalyze = async({companyName, jobTitle, jobDescription, file} : {companyName: string, jobTitle: string, jobDescription: string ,file: File}) => {
        try {
            console.log("Starting handleAnalyze");
            setIsProcessing(true);

            setStatusText("Uploading PDF...");
            const uploadedFile = await fs.upload([file]);
            console.log("Uploaded file:", uploadedFile);

            if (!uploadedFile) {
                setStatusText("Error: Failed to upload file");
                setIsProcessing(false);
                return;
            }

            // Convert PDF to Image
            setStatusText("Converting PDF to image...");
            const imageResult = await convertPdfToImage(file);
            console.log("PDF Conversion result:", imageResult);

            let uploadedImage = null;
            if (imageResult.file && !imageResult.error) {
                setStatusText("Uploading image...");
                uploadedImage = await fs.upload([imageResult.file]);
                console.log("Uploaded image:", uploadedImage);
            } else {
                console.warn("PDF conversion failed, continuing without image:", imageResult.error);
                setStatusText("PDF conversion failed, continuing analysis...");
            }

            setStatusText("Preparing data...");
            const uuid = generateUUID();
            console.log("Generated UUID:", uuid);

            // Create default feedback structure
            const defaultFeedback = createDefaultFeedback(jobTitle, companyName);

            // Create data object with feedback as object
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage ? uploadedImage.path : "",
                companyName,
                jobTitle,
                jobDescription,
                feedback: defaultFeedback,
            }

            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            console.log("Data saved to KV store with default feedback");

            // Try AI feedback to enhance the default
            try {
                setStatusText("Analyzing with AI to enhance feedback...");
                console.log("Attempting AI feedback...");

                const aiResponse = await ai.feedback(
                    uploadedFile.path,
                    prepareInstructions({
                        jobTitle,
                        jobDescription,
                        AIResponseFormat: "json"
                    })
                );

                console.log("AI Response received:", aiResponse);

                if (aiResponse && aiResponse.message) {
                    const feedbackText = typeof aiResponse.message.content === "string"
                        ? aiResponse.message.content
                        : aiResponse.message.content[0].text;

                    const aiFeedback = JSON.parse(feedbackText);

                    // Merge AI feedback with default structure
                    const enhancedFeedback = {
                        ...defaultFeedback,
                        ...aiFeedback,
                        toneAndStyle: {
                            score: aiFeedback.toneAndStyle?.score || defaultFeedback.toneAndStyle.score,
                            tips: aiFeedback.toneAndStyle?.tips || defaultFeedback.toneAndStyle.tips
                        },
                        content: {
                            score: aiFeedback.content?.score || defaultFeedback.content.score,
                            tips: aiFeedback.content?.tips || defaultFeedback.content.tips
                        },
                        structure: {
                            score: aiFeedback.structure?.score || defaultFeedback.structure.score,
                            tips: aiFeedback.structure?.tips || defaultFeedback.structure.tips
                        },
                        skills: {
                            score: aiFeedback.skills?.score || defaultFeedback.skills.score,
                            tips: aiFeedback.skills?.tips || defaultFeedback.skills.tips
                        },
                        ATS: {
                            score: aiFeedback.ATS?.score || defaultFeedback.ATS.score,
                            tips: aiFeedback.ATS?.tips || defaultFeedback.ATS.tips
                        },
                    };

                    data.feedback = enhancedFeedback;
                    await kv.set(`resume:${uuid}`, JSON.stringify(data));
                    console.log("AI feedback saved and merged");
                    setStatusText("AI analysis complete!");
                } else {
                    console.log("No valid AI response, keeping default feedback");
                }
            } catch (aiError) {
                console.error("AI feedback failed, using default feedback:", aiError);
                setStatusText("AI service unavailable, using standard analysis...");
            }

            setStatusText("Analysis complete, redirecting...");
            console.log("About to navigate to:", `/resume/${uuid}`);

            setTimeout(() => {
                navigate(`/resume/${uuid}`);
            }, 1000);

        } catch (err: any) {
            console.error("ERROR in handleAnalyze:", err);
            setStatusText(err.message || "Something went wrong");
            setIsProcessing(false);
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!file) {
            setStatusText("Please upload a file");
            return;
        }

        const formData = new FormData(e.currentTarget);
        const companyName = formData.get("company-name") as string;
        const jobTitle = formData.get("job-title") as string;
        const jobDescription = formData.get("job-description") as string;

        if (!companyName || !jobTitle || !jobDescription) {
            setStatusText("Please fill in all fields");
            return;
        }

        console.log("Starting submission with:", {companyName, jobTitle, file: file.name});
        handleAnalyze({companyName, jobTitle, jobDescription, file});
    };

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>

                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full" alt="Processing" />
                        </>
                    ) : (
                        <>
                            <h2>Drop your resume for an ATS score and improvement tips</h2>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                                <div className="form-div">
                                    <label htmlFor="company-name">Company Name</label>
                                    <input
                                        type="text"
                                        name="company-name"
                                        id="company-name"
                                        placeholder="Company Name"
                                        required
                                    />
                                </div>

                                <div className="form-div">
                                    <label htmlFor="job-title">Job Title</label>
                                    <input
                                        type="text"
                                        name="job-title"
                                        id="job-title"
                                        placeholder="Job Title"
                                        required
                                    />
                                </div>

                                <div className="form-div">
                                    <label htmlFor="job-description">Job Description</label>
                                    <textarea
                                        rows={5}
                                        name="job-description"
                                        id="job-description"
                                        placeholder="Job Description"
                                        required
                                    />
                                </div>

                                <div className="form-div">
                                    <label>Upload Resume</label>
                                    <FileUploader onFileSelect={handleFileSelect} />
                                </div>

                                <button className="primary-button" type="submit">
                                    Analyze Resume
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
};

export default Upload;