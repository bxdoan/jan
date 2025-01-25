import React, { useState, useRef, useEffect } from 'react'

import { Button } from '@janhq/joi'
import { useAtomValue } from 'jotai'

import { Send } from 'lucide-react'

import LogoMark from '@/containers/Brand/Logo/Mark'

import { selectedTextAtom } from '@/containers/Providers/Jotai'

import SelectedText from './SelectedText'
import suggestedPrompts from '@/helpers/atoms/suggested_prompts.json'

// Tạo component gợi ý
const FirstTimeSuggestions = ({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) => {
  const [suggestions, setSuggestions] = useState({})

  useEffect(() => {
    setSuggestions(suggestedPrompts.categories)
  }, [])

  const renderSuggestionCategory = (categoryName: string, prompts: string[]) => (
    <div key={categoryName} className="mb-4">
      <h3 className="text-sm font-semibold text-gray-600 mb-2">
        {categoryName.replace('_', ' ').toUpperCase()}
      </h3>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(prompt)}
            className="px-3 py-1 bg-[hsla(var(--app-bg-secondary))] hover:bg-[hsla(var(--app-bg-hover))] rounded-full text-xs text-[hsla(var(--text-secondary))] transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="first-time-suggestions space-y-2">
      {Object.entries(suggestions).map(([categoryName, prompts]) => 
        renderSuggestionCategory(categoryName, prompts as string[])
      )}
    </div>
  )
}

const UserInput = () => {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const selectedText = useAtomValue(selectedTextAtom)

  useEffect(() => {
    inputRef.current?.focus()
  })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.core?.api?.hideQuickAskWindow()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { value } = event.target
    setInputValue(value)
    // Ẩn gợi ý khi bắt đầu nhập
    setShowSuggestions(value.trim() === '')
  }

  const handleSelectPrompt = (prompt: string) => {
    // Loại bỏ phần tiền tố danh mục
    const cleanPrompt = prompt.split(': ')[1] || prompt
    setInputValue(cleanPrompt)
    setShowSuggestions(false)
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() !== '') {
      const fullText = `${inputValue} ${selectedText}`.trim()
      window.core?.api?.sendQuickAskInput(fullText)
      setInputValue('')
      window.core?.api?.hideQuickAskWindow()
      window.core?.api?.showMainWindow()
      // Reset lại trạng thái gợi ý
      setShowSuggestions(true)
    }
  }

  return (
    <div className="flex flex-col space-y-3 bg-[hsla(var(--app-bg))] p-3">
      <form
        ref={formRef}
        className="flex h-full w-full items-center justify-center"
        onSubmit={onSubmit}
      >
        <div className="flex h-full w-full items-center gap-4">
          <LogoMark width={28} height={28} className="mx-auto" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent font-bold focus:outline-none"
            type="text"
            value={inputValue}
            onChange={handleChange}
            placeholder="Ask me anything"
          />
          <Button onClick={onSubmit}>
            <Send size={16} />
          </Button>
        </div>
      </form>
      
      {/* Hiển thị gợi ý khi showSuggestions là true */}
      {showSuggestions && (
        <FirstTimeSuggestions onSelectPrompt={handleSelectPrompt} />
      )}
      
      <SelectedText onCleared={() => inputRef?.current?.focus()} />
    </div>
  )
}

export default UserInput
