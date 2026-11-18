import { Combobox, ComboboxTrigger, ComboboxContent, ComboboxSearch, ComboboxList, ComboboxClear } from '../../components/combobox/Combobox'


export default function Movies() {
    return (
        <>
            <p>olá</p>
            <Combobox 
  options={[
    { value: '1', label: 'Ação' },
    { value: '2', label: 'Comédia' },
    { value: '3', label: 'Drama' }
  ]}
  clearable
  placeholder="Buscar gênero..."
>
  <ComboboxTrigger />
  <ComboboxContent>
    <ComboboxList />
  </ComboboxContent>
</Combobox>
        </>
    )
}