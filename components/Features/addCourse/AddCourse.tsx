"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { validateAndSaveCourse } from "@/lib/LLMCourseValidation/courseValidation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CourseType } from "@/lib/enum"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

const courseSchema = z.object({
  courseId: z.number().int().positive(),
  date: z.string(),
  keywords: z.string().min(1, "Keywords are required"),
  mainSubjects: z.string().optional(),
  courseType: z.nativeEnum(CourseType),
  newSubjects: z.string().optional(),
  reviewSubjects: z.string().optional(),
  weaknesses: z.string().optional(),
  strengths: z.string().optional(),
  notes: z.string().min(1, "Notes are required"),
  practice: z.string().min(1, "Practice is required"),
  homework: z.string().optional(),
  newWords: z.string().min(1, "New words are required"),
})

type CourseData = z.infer<typeof courseSchema>

export function AddCourse() {
  const [step, setStep] = useState(1)
  const [llmSuggestions, setLlmSuggestions] = useState<Partial<CourseData> | null>(null)
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<keyof CourseData>>(new Set())
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)
  const [courseIdError, setCourseIdError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const form = useForm<CourseData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseId: 1,
      date: new Date().toISOString().split("T")[0],
      keywords: "",
      courseType: CourseType.NEW,
      notes: "",
      practice: "",
      mainSubjects: "",
      newSubjects: "",
      reviewSubjects: "",
      weaknesses: "",
      strengths: "",
      homework: "",
      newWords: "",
    },
  })

  const checkCourseIdDuplicate = async (courseId: number) => {
    if (!courseId || courseId <= 0) {
      return
    }

    setIsCheckingDuplicate(true)
    setCourseIdError(null)

    try {
      const response = await fetch(`/api/courses/check-duplicate?courseId=${courseId}`)
      const result = await response.json()

      if (result.success && result.data.isDuplicate) {
        const existingCourse = result.data.existingCourse
        const errorMsg = `Course ID ${courseId} already exists (created on ${new Date(existingCourse.date).toLocaleDateString()}). Please use a different ID.`
        setCourseIdError(errorMsg)
        form.setError("courseId", {
          type: "manual",
          message: errorMsg,
        })
      } else {
        setCourseIdError(null)
        form.clearErrors("courseId")
      }
    } catch (error) {
      console.error("Error checking duplicate:", error)
      setCourseIdError("Unable to check for duplicates. Please try again.")
    } finally {
      setIsCheckingDuplicate(false)
    }
  }

  const onSubmit = async (data: CourseData) => {
    console.log("Submitting", data)
    setSubmitError(null)
    setSubmitSuccess(false)

    if (step < 3) {
      setStep(step + 1)
    } else if (step === 3 && !llmSuggestions) {
      setIsSubmitting(true)
      try {
        const result = await validateAndSaveCourse(data)
        if (result.suggestions) {
          setLlmSuggestions(result.suggestions)
        } else if (result.success) {
          setSubmitSuccess(true)
          setTimeout(() => {
            form.reset()
            setStep(1)
            setSubmitSuccess(false)
          }, 2000)
        } else {
          setSubmitError(result.error || "Failed to add course. Please try again.")
        }
      } catch (error) {
        setSubmitError("An unexpected error occurred. Please try again.")
        console.error("Submit error:", error)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setIsSubmitting(true)
      try {
        const result = await validateAndSaveCourse(data, true)
        if (result.success) {
          setSubmitSuccess(true)
          setTimeout(() => {
            form.reset()
            setStep(1)
            setLlmSuggestions(null)
            setAcceptedSuggestions(new Set())
            setSubmitSuccess(false)
          }, 2000)
        } else {
          setSubmitError(result.error || "Failed to add course. Please try again.")
        }
      } catch (error) {
        setSubmitError("An unexpected error occurred. Please try again.")
        console.error("Submit error:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const goBack = () => {
    if (step === 3) {
      setLlmSuggestions(null)
      console.log("Resetting suggestions")
    }
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const applySuggestion = (key: keyof CourseData, value: string) => {
    form.setValue(key, value)
    setAcceptedSuggestions((prev) => {
      const newSet = new Set(prev)
      newSet.add(key)
      return newSet
    })
  }

  const ignoreSuggestion = (key: keyof CourseData) => {
    setAcceptedSuggestions((prev) => {
      const newSet = new Set(prev)
      newSet.delete(key)
      return newSet
    })
  }

  const renderFormField = (name: keyof CourseData, label: string, required = false, type = "text") => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            {type === "textarea" ? (
              <Textarea {...field} className="min-h-[100px]" />
            ) : type === "select" ? (
              <Controller
                name={name}
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(CourseType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <Input
                type={type}
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  if (name === "courseId") {
                    const value = Number.parseInt(e.target.value, 10)
                    field.onChange(value)
                    setCourseIdError(null)
                  } else {
                    field.onChange(e.target.value)
                  }
                }}
                onBlur={(e) => {
                  if (name === "courseId") {
                    const value = Number.parseInt(e.target.value, 10)
                    if (value > 0) {
                      checkCourseIdDuplicate(value)
                    }
                  }
                  field.onBlur()
                }}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof CourseData)[] = []

    if (step === 1) {
      fieldsToValidate = [
        "courseId",
        "date",
        "keywords",
        "mainSubjects",
        "courseType",
        "newSubjects",
        "reviewSubjects",
        "weaknesses",
        "strengths",
      ]

      // Check for duplicate courseId before proceeding
      const courseId = form.getValues("courseId")
      if (courseId) {
        await checkCourseIdDuplicate(courseId)
        if (courseIdError) {
          return // Don't proceed if there's a duplicate
        }
      }
    } else if (step === 2) {
      fieldsToValidate = ["notes", "practice", "homework", "newWords"]
    }

    if (step < 3) {
      const isValid = await form.trigger(fieldsToValidate)
      console.log("isValid", isValid)
      console.log("Form values:", form.getValues())
      console.log("Form errors:", form.formState.errors)
      if (isValid && !courseIdError) {
        setSubmitError(null)
        setStep(step + 1)
      }
    } else {
      form.handleSubmit(onSubmit)()
    }
  }

  return (
    <Card className="mx-auto mt-8 w-[800px]">
      <CardHeader>
        <CardTitle>Add New Course</CardTitle>
      </CardHeader>
      <CardContent>
        {submitSuccess && (
          <Alert className="mb-4 border-green-500 bg-green-50">
            <CheckCircle2 className="size-4 text-green-600" />
            <AlertTitle className="text-green-800">Success!</AlertTitle>
            <AlertDescription className="text-green-700">
              Course added successfully! Redirecting...
            </AlertDescription>
          </Alert>
        )}
        {submitError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <ScrollArea className="h-[60vh] pr-4">
              {step === 1 && (
                <>
                  <div className="relative">
                    {renderFormField("courseId", "Course ID", true, "number")}
                    {isCheckingDuplicate && (
                      <div className="absolute right-2 top-9">
                        <Loader2 className="size-4 animate-spin text-blue-500" />
                      </div>
                    )}
                    {courseIdError && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{courseIdError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  {renderFormField("date", "Date", true, "date")}
                  {renderFormField("keywords", "Keywords (comma-separated)", true)}
                  {renderFormField("mainSubjects", "Main Subjects (comma-separated)")}
                  {renderFormField("courseType", "Course Type", true, "select")}
                  {renderFormField("newSubjects", "New Subjects (comma-separated)")}
                  {renderFormField("reviewSubjects", "Review Subjects (comma-separated)")}
                  {renderFormField("weaknesses", "Weaknesses (comma-separated)")}
                  {renderFormField("strengths", "Strengths (comma-separated)")}
                </>
              )}

              {step === 2 && (
                <>
                  {renderFormField("notes", "Notes", true, "textarea")}
                  {renderFormField("practice", "Practice", true, "textarea")}
                  {renderFormField("homework", "Homework", false, "textarea")}
                  {renderFormField("newWords", "New Words (comma-separated)", true)}
                </>
              )}

              {step === 3 && (
                <div>
                  <h2 className="mb-4 text-xl font-bold">Review and Confirm</h2>
                  {Object.entries(form.getValues()).map(([key, value]) => {
                    const suggestion = llmSuggestions?.[key as keyof CourseData]
                    const isAccepted = acceptedSuggestions.has(key as keyof CourseData)
                    return (
                      <div key={key} className="mb-4 border-b pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <strong>{key}:</strong>
                            <div>{isAccepted ? suggestion : value}</div>
                          </div>
                          {suggestion && suggestion !== value && (
                            <div className="ml-4 flex flex-col items-end">
                              <div className="mb-1 text-sm text-gray-600">
                                {isAccepted ? "Original" : "Suggestion"}:
                              </div>
                              <div>{isAccepted ? value : suggestion}</div>
                              <div className="mt-2">
                                {isAccepted ? (
                                  <Button
                                    onClick={() => ignoreSuggestion(key as keyof CourseData)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    Ignore
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => applySuggestion(key as keyof CourseData, String(suggestion))}
                                    size="sm"
                                  >
                                    Accept
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            <div className="flex justify-between pt-4">
              {step > 1 && (
                <Button type="button" onClick={goBack} variant="outline" disabled={isSubmitting}>
                  Previous
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={isSubmitting || isCheckingDuplicate || !!courseIdError}
              >
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isSubmitting
                  ? "Saving..."
                  : step < 3
                    ? "Next"
                    : llmSuggestions
                      ? "Apply and Finalize"
                      : "Finalize"
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}