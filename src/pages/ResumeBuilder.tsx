import { useState } from "react";
import { motion } from "framer-motion";
import { FileUser, Download, Plus, Trash2, GripVertical } from "lucide-react";
import { jsPDF } from "jspdf";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import { toast } from "sonner";

interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: {
    company: string;
    role: string;
    period: string;
    description: string;
  }[];
  education: {
    school: string;
    degree: string;
    year: string;
  }[];
  skills: string[];
}

const defaultResume: ResumeData = {
  name: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  experience: [],
  education: [],
  skills: [],
};

const ResumeBuilder = () => {
  const [resume, setResume] = useState<ResumeData>(defaultResume);
  const [newSkill, setNewSkill] = useState("");

  const updateField = (field: keyof ResumeData, value: any) => {
    setResume((prev) => ({ ...prev, [field]: value }));
  };

  const addExperience = () => {
    setResume((prev) => ({
      ...prev,
      experience: [...prev.experience, { company: "", role: "", period: "", description: "" }],
    }));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const removeExperience = (index: number) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const addEducation = () => {
    setResume((prev) => ({
      ...prev,
      education: [...prev.education, { school: "", degree: "", year: "" }],
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const removeEducation = (index: number) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setResume((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setResume((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const generatePDF = () => {
    if (!resume.name) {
      toast.error("Please enter your name");
      return;
    }

    const doc = new jsPDF();
    let y = 20;
    const lineHeight = 7;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;

    // Name
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(resume.name, pageWidth / 2, y, { align: "center" });
    y += 10;

    // Title
    if (resume.title) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(resume.title, pageWidth / 2, y, { align: "center" });
      y += 8;
    }

    // Contact
    doc.setFontSize(10);
    doc.setTextColor(100);
    const contact = [resume.email, resume.phone, resume.location].filter(Boolean).join(" | ");
    if (contact) {
      doc.text(contact, pageWidth / 2, y, { align: "center" });
      y += 10;
    }

    doc.setTextColor(0);

    // Summary
    if (resume.summary) {
      y += 5;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("SUMMARY", margin, y);
      y += 2;
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const summaryLines = doc.splitTextToSize(resume.summary, pageWidth - margin * 2);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * lineHeight;
    }

    // Experience
    if (resume.experience.length > 0) {
      y += 5;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("EXPERIENCE", margin, y);
      y += 2;
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      resume.experience.forEach((exp) => {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(exp.role, margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(exp.period, pageWidth - margin, y, { align: "right" });
        y += lineHeight;
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(exp.company, margin, y);
        doc.setTextColor(0);
        y += lineHeight;
        if (exp.description) {
          const descLines = doc.splitTextToSize(exp.description, pageWidth - margin * 2);
          doc.text(descLines, margin, y);
          y += descLines.length * lineHeight;
        }
        y += 3;
      });
    }

    // Education
    if (resume.education.length > 0) {
      y += 5;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("EDUCATION", margin, y);
      y += 2;
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      resume.education.forEach((edu) => {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(edu.school, margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(edu.year, pageWidth - margin, y, { align: "right" });
        y += lineHeight;
        doc.setFontSize(10);
        doc.text(edu.degree, margin, y);
        y += lineHeight + 3;
      });
    }

    // Skills
    if (resume.skills.length > 0) {
      y += 5;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("SKILLS", margin, y);
      y += 2;
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(resume.skills.join(" • "), margin, y);
    }

    doc.save(`${resume.name.replace(/\s+/g, "_")}_Resume.pdf`);
    toast.success("Resume downloaded!");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <ToolHeader
          title="Resume Builder"
          description="Build a professional resume and download as PDF"
          icon={FileUser}
          color="--tool-resume"
        />

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 md:p-8"
          >
            {/* Personal Info */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={resume.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="input-dark"
                />
                <input
                  type="text"
                  placeholder="Professional Title"
                  value={resume.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="input-dark"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={resume.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="input-dark"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={resume.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="input-dark"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={resume.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  className="input-dark md:col-span-2"
                />
              </div>
            </section>

            {/* Summary */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Professional Summary</h3>
              <textarea
                placeholder="Write a brief summary about yourself..."
                value={resume.summary}
                onChange={(e) => updateField("summary", e.target.value)}
                className="input-dark w-full h-24 resize-none"
              />
            </section>

            {/* Experience */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Experience</h3>
                <button
                  onClick={addExperience}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Add Experience
                </button>
              </div>
              <div className="space-y-4">
                {resume.experience.map((exp, index) => (
                  <div key={index} className="p-4 rounded-xl bg-secondary/50 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid md:grid-cols-2 gap-3 flex-1">
                        <input
                          type="text"
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, "company", e.target.value)}
                          className="input-dark"
                        />
                        <input
                          type="text"
                          placeholder="Role"
                          value={exp.role}
                          onChange={(e) => updateExperience(index, "role", e.target.value)}
                          className="input-dark"
                        />
                        <input
                          type="text"
                          placeholder="Period (e.g., 2020 - Present)"
                          value={exp.period}
                          onChange={(e) => updateExperience(index, "period", e.target.value)}
                          className="input-dark md:col-span-2"
                        />
                      </div>
                      <button
                        onClick={() => removeExperience(index)}
                        className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                    <textarea
                      placeholder="Description of your role..."
                      value={exp.description}
                      onChange={(e) => updateExperience(index, "description", e.target.value)}
                      className="input-dark w-full h-20 resize-none"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Education */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Education</h3>
                <button
                  onClick={addEducation}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Add Education
                </button>
              </div>
              <div className="space-y-4">
                {resume.education.map((edu, index) => (
                  <div key={index} className="p-4 rounded-xl bg-secondary/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid md:grid-cols-3 gap-3 flex-1">
                        <input
                          type="text"
                          placeholder="School/University"
                          value={edu.school}
                          onChange={(e) => updateEducation(index, "school", e.target.value)}
                          className="input-dark"
                        />
                        <input
                          type="text"
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, "degree", e.target.value)}
                          className="input-dark"
                        />
                        <input
                          type="text"
                          placeholder="Year"
                          value={edu.year}
                          onChange={(e) => updateEducation(index, "year", e.target.value)}
                          className="input-dark"
                        />
                      </div>
                      <button
                        onClick={() => removeEducation(index)}
                        className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Skills</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSkill()}
                  className="input-dark flex-1"
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-tool-resume/20 text-tool-resume text-sm"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(index)}
                      className="hover:text-destructive transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </section>

            {/* Download Button */}
            <button
              onClick={generatePDF}
              className="w-full btn-primary-gradient flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, hsl(var(--tool-resume)) 0%, hsl(199 80% 40%) 100%)",
              }}
            >
              <Download className="w-5 h-5" />
              Download Resume as PDF
            </button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ResumeBuilder;
