import { useContext } from "react"
import { FieldContext, FieldGroupContext } from "./context"

export function useField() {
    return useContext(FieldContext)
}

export function useFieldGroup() {
    return useContext(FieldGroupContext)
}