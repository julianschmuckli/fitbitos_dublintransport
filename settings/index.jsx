function settings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Favourite stops</Text>}>
        <Text>Search here for stops, which you can access when you swipe from right to left in the app.</Text>
        <TextInput
          title="First favourite stop"
          label="First favourite stop"
          placeholder="Search for stops"
          action="Add stop"
          onAutocomplete={(value) => {
            const autoValues = [];
            
            props.settingsStorage.setItem('searchStations', value.trim());
            
            autoValues = props.settingsStorage.getItem('resultStations');
            
            return JSON.parse(autoValues);
          }}
        />
        <TextInput
          title="Second favourite stop"
          label="Second favourite stop"
          placeholder="Search for stops"
          action="Add stop"
          onAutocomplete={(value) => {
            const autoValues = [];
            
            props.settingsStorage.setItem('searchStations', value.trim());
            
            autoValues = props.settingsStorage.getItem('resultStations');
            
            return JSON.parse(autoValues);
          }}
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(settings);