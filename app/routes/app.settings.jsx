import { Page, Card, TextField } from "@shopify/polaris";

export default function Settings() {
  return (
    <Page title="Settings">
      <Card>
        <TextField label="Search Placeholder" />
      </Card>
    </Page>
  );
}