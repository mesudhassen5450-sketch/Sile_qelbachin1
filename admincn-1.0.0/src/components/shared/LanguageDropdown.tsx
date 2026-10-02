'use client'

import type { ReactElement } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAdminLocale, type AdminLang } from '@/context/AdminLocaleContext'

type Props = {
  trigger: ReactElement
  defaultOpen?: boolean
  align?: 'start' | 'center' | 'end'
}

/** Admin UI language: Amharic or English only (one at a time). */
const LanguageDropdown = ({ defaultOpen, align, trigger }: Props) => {
  const { lang, setLang } = useAdminLocale()

  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent className="w-44" align={align || 'end'}>
        <DropdownMenuRadioGroup
          value={lang}
          onValueChange={v => setLang(v as AdminLang)}
        >
          <DropdownMenuRadioItem value="am">አማርኛ</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageDropdown
